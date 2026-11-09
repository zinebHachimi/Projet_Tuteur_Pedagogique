from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class MessageIn(BaseModel):
    contenu: str


class MessageOut(BaseModel):
    id: int
    role: str
    contenu: str
    type: str
    temps_reponse_ms: Optional[int] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    titre: str
    created_at: datetime
    model_config = {"from_attributes": True}


class ConversationDetail(ConversationOut):
    messages: List[MessageOut] = []


class ChatResponse(BaseModel):
    conversation: ConversationOut
    user_message: MessageOut
    assistant_message: MessageOut


class ProfileStats(BaseModel):
    nb_discussions: int
    temps_reponse_moyen_ms: int
    nb_cours: int