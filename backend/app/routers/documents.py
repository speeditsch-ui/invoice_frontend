"""Invoice-related API endpoints."""

import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Invoice
from app.schemas import (
    InvoiceListResponse,
    InvoiceListItem,
    InvoiceDetail,
    InvoiceUpdateRequest,
    InvoiceUpdateResponse,
    FileListResponse,
    FileEntry,
)

router = APIRouter(prefix="/api", tags=["invoices"])

# Prefix used inside n8n containers – will be stripped when resolving to PDF_ROOT
_N8N_PREFIX = "/files/invoices/inbox/"


def _resolve_pdf_path(raw_path: Optional[str]) -> Optional[Path]:
    """
    Resolve a pdf_path value from the database to an actual file on disk.

    The DB stores paths in several formats:
      1. /files/invoices/inbox/<name>.pdf   (absolute inside n8n container)
      2. <name>.pdf                          (just the filename)
      3. Empty string or None                (no PDF)

    PDF_ROOT is mounted to the same directory on the host, so we strip the
    n8n prefix and look for the file relative to PDF_ROOT.
    """
    if not raw_path or not raw_path.strip():
        return None

    root = Path(settings.pdf_root).resolve()

    # Strip the n8n container prefix if present
    if raw_path.startswith(_N8N_PREFIX):
        relative = raw_path[len(_N8N_PREFIX):]
    elif raw_path.startswith("/"):
        # Some other absolute path – try the basename
        relative = Path(raw_path).name
    else:
        relative = raw_path

    full = (root / relative).resolve()

    # Guard against path traversal
    if not str(full).startswith(str(root)):
        return None

    if full.exists() and full.is_file():
        return full

    # Also try looking up by sha256-named file in PDF_ROOT
    return None


def _find_pdf_by_sha256(sha256: str) -> Optional[Path]:
    """Try to find a PDF file named <sha256>.pdf in PDF_ROOT."""
    root = Path(settings.pdf_root).resolve()
    candidate = root / f"{sha256}.pdf"
    if candidate.exists() and candidate.is_file():
        return candidate
    return None


# ── GET /api/files ───────────────────────────────────────

@router.get("/files", response_model=FileListResponse)
def list_files(db: Session = Depends(get_db)):
    """List all PDF files in PDF_ROOT with their linked invoice (if any)."""
    root = Path(settings.pdf_root).resolve()

    if not root.exists():
        return FileListResponse(total=0, files=[])

    # Collect all PDF files (recursively, so sub-directories like invoices/inbox/… are included)
    pdf_files = sorted(root.rglob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)

    # Build lookup maps from DB: filename -> invoice, sha256 -> invoice
    all_invoices = db.query(Invoice).all()

    sha_map: dict[str, Invoice] = {}
    path_map: dict[str, Invoice] = {}
    for inv in all_invoices:
        sha_map[inv.pdf_sha256] = inv
        if inv.pdf_path:
            # Extract just the filename from various path formats
            raw = inv.pdf_path.strip()
            if raw.startswith(_N8N_PREFIX):
                fname = raw[len(_N8N_PREFIX):]
            elif "/" in raw:
                fname = Path(raw).name
            else:
                fname = raw
            if fname:
                path_map[fname] = inv

    entries: list[FileEntry] = []
    for pdf in pdf_files:
        stat = pdf.stat()
        # Use relative path from PDF_ROOT so sub-directory files can be served back
        relative_path = str(pdf.relative_to(root))
        fname = pdf.name  # just the basename for matching against DB

        # Try to match: first by filename, then by sha256 (filename without .pdf)
        inv = path_map.get(fname)
        if not inv:
            stem = pdf.stem  # filename without extension
            inv = sha_map.get(stem)

        entries.append(FileEntry(
            filename=relative_path,
            size=stat.st_size,
            modified=datetime.fromtimestamp(stat.st_mtime),
            invoice_id=inv.id if inv else None,
            supplier_name=inv.supplier_name if inv else None,
            invoice_number=inv.invoice_number if inv else None,
        ))

    return FileListResponse(total=len(entries), files=entries)


# ── GET /api/files/{filename}/pdf ────────────────────────

@router.get("/files/{filename:path}/pdf")
def get_file_pdf(filename: str):
    """Serve a PDF file by its relative path from PDF_ROOT."""
    root = Path(settings.pdf_root).resolve()
    full = (root / filename).resolve()

    # Guard against path traversal
    if not str(full).startswith(str(root)):
        raise HTTPException(status_code=403, detail="Path traversal detected")
    if not full.exists() or not full.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(full),
        media_type="application/pdf",
        filename=full.name,
    )


# ── GET /api/invoices ────────────────────────────────────

@router.get("/invoices", response_model=InvoiceListResponse)
def list_invoices(
    search: Optional[str] = Query(None, description="Search by supplier, invoice number or email"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Invoice.supplier_name.ilike(pattern)
            | Invoice.invoice_number.ilike(pattern)
            | Invoice.source_email.ilike(pattern)
        )

    total = query.count()
    invoices = (
        query
        .order_by(Invoice.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return InvoiceListResponse(
        total=total,
        invoices=[
            InvoiceListItem(
                id=inv.id,
                supplier_name=inv.supplier_name,
                invoice_number=inv.invoice_number,
                invoice_date=inv.invoice_date,
                net_total=inv.net_total,
                currency=inv.currency,
                source_email=inv.source_email,
                created_at=inv.created_at,
            )
            for inv in invoices
        ],
    )


# ── GET /api/invoices/{id} ───────────────────────────────

@router.get("/invoices/{invoice_id}", response_model=InvoiceDetail)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Check if PDF exists on disk
    pdf = _resolve_pdf_path(inv.pdf_path) or _find_pdf_by_sha256(inv.pdf_sha256)

    return InvoiceDetail(
        id=inv.id,
        supplier_name=inv.supplier_name,
        invoice_number=inv.invoice_number,
        invoice_date=inv.invoice_date,
        net_total=inv.net_total,
        currency=inv.currency,
        vat_rate=inv.vat_rate,
        vat_amount=inv.vat_amount,
        source_email=inv.source_email,
        pdf_path=inv.pdf_path,
        llm_flags=inv.llm_flags,
        created_at=inv.created_at,
        pdf_sha256=inv.pdf_sha256,
        has_pdf=pdf is not None,
    )


# ── GET /api/invoices/{id}/pdf ───────────────────────────

@router.get("/invoices/{invoice_id}/pdf")
def get_invoice_pdf(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    pdf = _resolve_pdf_path(inv.pdf_path) or _find_pdf_by_sha256(inv.pdf_sha256)

    if not pdf:
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    filename = pdf.name if pdf.suffix == ".pdf" else f"{pdf.stem}.pdf"

    return FileResponse(
        path=str(pdf),
        media_type="application/pdf",
        filename=filename,
    )


# ── PUT /api/invoices/{id} ───────────────────────────────

@router.put("/invoices/{invoice_id}", response_model=InvoiceUpdateResponse)
def update_invoice(
    invoice_id: int,
    payload: InvoiceUpdateRequest,
    db: Session = Depends(get_db),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided")

    count = 0
    for key, value in update_data.items():
        if hasattr(inv, key):
            setattr(inv, key, value)
            count += 1

    db.commit()

    return InvoiceUpdateResponse(updated=count, message="Invoice updated successfully")
