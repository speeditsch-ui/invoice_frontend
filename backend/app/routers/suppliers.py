"""Supplier-by-email CRUD API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SupplierByEmail
from app.schemas import (
    SupplierByEmailItem,
    SupplierByEmailCreate,
    SupplierByEmailListResponse,
    DeleteResponse,
)

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


# ── GET /api/suppliers ───────────────────────────────────

@router.get("", response_model=SupplierByEmailListResponse)
def list_suppliers(db: Session = Depends(get_db)):
    """List all supplier-by-email mappings."""
    suppliers = (
        db.query(SupplierByEmail)
        .order_by(SupplierByEmail.supplier_name)
        .all()
    )
    return SupplierByEmailListResponse(
        total=len(suppliers),
        suppliers=[
            SupplierByEmailItem(
                id=s.id,
                supplier_name=s.supplier_name,
                email=s.email,
            )
            for s in suppliers
        ],
    )


# ── POST /api/suppliers ──────────────────────────────────

@router.post("", response_model=SupplierByEmailItem, status_code=201)
def create_supplier(
    payload: SupplierByEmailCreate,
    db: Session = Depends(get_db),
):
    """Add a new supplier-email mapping."""
    supplier = SupplierByEmail(
        supplier_name=payload.supplier_name,
        email=payload.email,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return SupplierByEmailItem(
        id=supplier.id,
        supplier_name=supplier.supplier_name,
        email=supplier.email,
    )


# ── DELETE /api/suppliers/{id} ────────────────────────────

@router.delete("/{supplier_id}", response_model=DeleteResponse)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Delete a supplier-email mapping by ID."""
    supplier = (
        db.query(SupplierByEmail)
        .filter(SupplierByEmail.id == supplier_id)
        .first()
    )
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()
    return DeleteResponse(deleted=True, message="Supplier deleted successfully")
