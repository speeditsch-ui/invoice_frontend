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
    # Spalten aus telegram_invoices
    filename: Optional[str] = None
    telegram_text: Optional[str] = None
    zahlungstyp: Optional[str] = None
    ocr_text: Optional[str] = None
    llm_json: Optional[str] = None
    confidence: Optional[Decimal] = None
    updated_at: Optional[datetime] = None
    erledigt: bool = False
    erledigt_datum: Optional[date] = None

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
    filename: Optional[str] = None
    telegram_text: Optional[str] = None
    zahlungstyp: Optional[str] = None
    ocr_text: Optional[str] = None
    llm_json: Optional[str] = None
    confidence: Optional[Decimal] = None
    erledigt: Optional[bool] = None
    erledigt_datum: Optional[date] = None


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


# ── Supplier by Email ─────────────────────────────────────

class SupplierByEmailItem(BaseModel):
    id: int
    supplier_name: str
    email: str

    model_config = {"from_attributes": True}


class SupplierByEmailCreate(BaseModel):
    supplier_name: str
    email: str


class SupplierByEmailListResponse(BaseModel):
    total: int
    suppliers: list[SupplierByEmailItem]


class DeleteResponse(BaseModel):
    deleted: bool
    message: str


# ── Datenquelle ───────────────────────────────────────────

class DatenquelleItem(BaseModel):
    id: int
    plattform: str

    model_config = {"from_attributes": True}


class DatenquelleCreate(BaseModel):
    plattform: str
