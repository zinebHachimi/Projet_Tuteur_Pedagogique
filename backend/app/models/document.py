from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)  # cours facultatif
    nom_fichier = Column(String(255), nullable=False)
    chemin = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)