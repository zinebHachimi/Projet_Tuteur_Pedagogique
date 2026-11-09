from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)          # "user" ou "assistant"
    contenu = Column(Text, nullable=False)
    type = Column(String(30), default="general")       # cours, exercice, qcm, resume, traduction, code, general
    temps_reponse_ms = Column(Integer, nullable=True)  # rempli pour les réponses de l'assistant
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")