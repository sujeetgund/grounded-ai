from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import DocumentStatus

class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = {}

class CollectionCreate(CollectionBase):
    pass

class CollectionResponse(CollectionBase):
    id: str
    created_at: datetime
    docCount: int = 0
    groundingScore: int = 0
    
    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: DocumentStatus
    collection_id: str
    created_at: datetime
    chunks: Optional[int] = None
    
    class Config:
        from_attributes = True

class CollectionDetailResponse(CollectionResponse):
    documents: List[DocumentResponse] = []
