"""Pydantic schemas for request/response validation."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


# ── Invoice list ──────────────────────────────────────────

class InvoiceListItem(BaseModel):
    id: int
    supplier_name: str
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    net_total: Optional[Decimal] = None
    currency: Optional[str] = None
    source_email: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InvoiceListResponse(BaseModel):
    total: int
    invoices: list[InvoiceListItem]


# ── Single invoice detail ────────────────────────────────

class InvoiceDetail(BaseModel):
    id: int
    supplier_name: str
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    net_total: Optional[Decimal] = None
    currency: Optional[str] = None
    vat_rate: Optional[Decimal] = None
    vat_amount: Optional[Decimal] = None
    source_email: str
    pdf_path: Optional[str] = None
    llm_flags: Optional[str] = None
    created_at: Optional[datetime] = None
    pdf_sha256: str
    has_pdf: bool = False

    model_config = {"from_attributes": True}


# ── Invoice field update ─────────────────────────────────

class InvoiceUpdateRequest(BaseModel):
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    net_total: Optional[Decimal] = None
    currency: Optional[str] = None
    vat_rate: Optional[Decimal] = None
    vat_amount: Optional[Decimal] = None
    source_email: Optional[str] = None


class InvoiceUpdateResponse(BaseModel):
    updated: int
    message: str


# ── File listing ──────────────────────────────────────────

class FileEntry(BaseModel):
    filename: str
    size: int
    modified: datetime
    invoice_id: Optional[int] = None
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None


class FileListResponse(BaseModel):
    total: int
    files: list[FileEntry]
