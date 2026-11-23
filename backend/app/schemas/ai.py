from typing import Optional, Dict, Any
from pydantic import BaseModel

class AIChatRequest(BaseModel):
    message: str
    context_type: Optional[str] = "general"

class AIChatResponse(BaseModel):
    reply: str
    intent: Optional[str] = None
    suggested_action: Optional[str] = None
    action_data: Optional[Dict[str, Any]] = None
