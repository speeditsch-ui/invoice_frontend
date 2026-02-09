"""Document-related API endpoints."""

import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import text, func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Document, DocumentField
from app.schemas import (
    DocumentListResponse,
    DocumentListItem,
    DocumentDetail,
    FieldsUpdateRequest,
    FieldsUpdateResponse,
)

router = APIRouter(prefix="/api/documents", tags=["documents"])


# ── GET /api/documents ───────────────────────────────────

@router.get("", response_model=DocumentListResponse)
def list_documents(
    search: Optional[str] = Query(None, description="Search by file_name"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Document)

    if search:
        query = query.filter(Document.file_name.ilike(f"%{search}%"))

    total = query.count()
    docs = (
        query
        .order_by(Document.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return DocumentListResponse(
        total=total,
        documents=[
            DocumentListItem(
                id=d.id,
                file_name=d.file_name,
                created_at=d.created_at,
            )
            for d in docs
        ],
    )


# ── GET /api/documents/{id} ─────────────────────────────

@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    fields_dict = {f.field_key: f.field_value for f in doc.fields}

    return DocumentDetail(
        id=doc.id,
        file_name=doc.file_name,
        file_path=doc.file_path,
        created_at=doc.created_at,
        fields=fields_dict,
    )


# ── GET /api/documents/{id}/pdf ──────────────────────────

def _safe_pdf_path(file_path: str) -> Path:
    """Resolve file_path relative to PDF_ROOT and guard against path traversal."""
    root = Path(settings.pdf_root).resolve()
    full = (root / file_path).resolve()

    if not str(full).startswith(str(root)):
        raise HTTPException(status_code=403, detail="Path traversal detected")

    if not full.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    if not full.is_file():
        raise HTTPException(status_code=404, detail="Path is not a file")

    return full


@router.get("/{document_id}/pdf")
def get_document_pdf(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    pdf_path = _safe_pdf_path(doc.file_path)

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=doc.file_name,
    )


# ── PUT /api/documents/{id}/fields ───────────────────────

@router.put("/{document_id}/fields", response_model=FieldsUpdateResponse)
def update_fields(
    document_id: int,
    payload: FieldsUpdateRequest,
    db: Session = Depends(get_db),
):
    # Verify document exists
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not payload.fields:
        raise HTTPException(status_code=400, detail="No fields provided")

    # Upsert each field using ON DUPLICATE KEY UPDATE
    upsert_sql = text(
        """
        INSERT INTO document_fields (document_id, field_key, field_value, updated_at)
        VALUES (:doc_id, :key, :value, NOW())
        ON DUPLICATE KEY UPDATE
            field_value = VALUES(field_value),
            updated_at  = NOW()
        """
    )

    count = 0
    for key, value in payload.fields.items():
        db.execute(upsert_sql, {"doc_id": document_id, "key": key, "value": value})
        count += 1

    db.commit()

    return FieldsUpdateResponse(updated=count, message="Fields updated successfully")
