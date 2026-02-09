"""SQLAlchemy ORM models matching db/init.sql schema."""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    fields = relationship(
        "DocumentField",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class DocumentField(Base):
    __tablename__ = "document_fields"

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    )
    field_key = Column(String(255), primary_key=True)
    field_value = Column(Text, nullable=True)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    document = relationship("Document", back_populates="fields")
