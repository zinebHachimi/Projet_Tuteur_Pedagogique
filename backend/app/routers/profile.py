from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import ProfileStats

router = APIRouter(prefix="/profile", tags=["Profil"])


@router.get("/stats", response_model=ProfileStats)
def stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    nb_discussions = (
        db.query(func.count(Conversation.id))
        .filter(Conversation.user_id == user.id)
        .scalar()
    )

    reponses = (
        db.query(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == user.id, Message.role == "assistant")
    )

    moyenne = reponses.with_entities(func.avg(Message.temps_reponse_ms)).scalar()
    nb_cours = reponses.filter(Message.type == "cours").count()

    return ProfileStats(
        nb_discussions=nb_discussions,
        temps_reponse_moyen_ms=int(moyenne or 0),
        nb_cours=nb_cours,
    )