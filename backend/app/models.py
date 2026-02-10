"""SQLAlchemy ORM models mapped to existing 'telegram' database tables."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    DECIMAL,
    CHAR,
    Index,
    TIMESTAMP,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Invoice(Base):
    """Maps to the existing `invoices` table in the telegram database."""

    __tablename__ = "invoices"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    supplier_name: str = Column(String(255), nullable=False, default="")
    invoice_number: Optional[str] = Column(String(64), nullable=True)
    invoice_date: Optional[date] = Column(Date, nullable=True)
    net_total: Optional[Decimal] = Column(DECIMAL(12, 2), nullable=True)
    currency: Optional[str] = Column(CHAR(3), nullable=True)
    vat_rate: Optional[Decimal] = Column(DECIMAL(5, 2), nullable=True)
    vat_amount: Optional[Decimal] = Column(DECIMAL(12, 2), nullable=True)
    source_email: str = Column(String(255), nullable=False, default="")
    pdf_path: Optional[str] = Column(Text, nullable=True)
    llm_flags: Optional[str] = Column(Text, nullable=True)
    created_at: Optional[datetime] = Column(TIMESTAMP, nullable=True, default=datetime.utcnow)
    pdf_sha256: str = Column(CHAR(64), nullable=False, unique=True)

    __table_args__ = (
        Index("idx_supplier_name", "supplier_name"),
        Index("idx_source_email", "source_email"),
    )
