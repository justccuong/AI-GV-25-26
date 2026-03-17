from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class MindMapCreate(BaseModel):
    title: str = 'Untitled diagram'
    data: Dict[str, Any] = Field(default_factory=dict)


class MindMapUpdate(BaseModel):
    title: str = 'Untitled diagram'
    data: Dict[str, Any] = Field(default_factory=dict)


class MindMapRename(BaseModel):
    title: str


class MindMapSummary(BaseModel):
    id: int
    title: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MindMapDetail(MindMapSummary):
    data: Dict[str, Any] = Field(default_factory=dict)


class AssistantMindMapRequest(BaseModel):
    prompt: str
    current_diagram: Optional[Dict[str, Any]] = None


class AssistantMindMapResponse(BaseModel):
    title: Optional[str] = None
    message: str
    diagram: Dict[str, Any] = Field(default_factory=dict)
