"""Pydantic schemas for request/response validation."""

from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel


# ── Documents list ───────────────────────────────────────

class DocumentListItem(BaseModel):
    id: int
    file_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    total: int
    documents: list[DocumentListItem]


# ── Single document detail ───────────────────────────────

class DocumentDetail(BaseModel):
    id: int
    file_name: str
    file_path: str
    created_at: datetime
    fields: Dict[str, Optional[str]]

    model_config = {"from_attributes": True}


# ── Field update ─────────────────────────────────────────

class FieldsUpdateRequest(BaseModel):
    fields: Dict[str, Optional[str]]


class FieldsUpdateResponse(BaseModel):
    updated: int
    message: str
