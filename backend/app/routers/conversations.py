import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.document import Document
from app.schemas.chat import (
    ConversationOut, ConversationDetail, MessageIn, ChatResponse,
)
from app.services.chat_service import generate_reply
from app.services.rag_service import search as rechercher_supports
from app.services.rag_service import remove_document
from pathlib import Path

router = APIRouter(prefix="/conversations", tags=["Conversations"])


def get_owned(db: Session, conv_id: int, user: User) -> Conversation:
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conv_id, Conversation.user_id == user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Discussion introuvable")
    return conv


@router.post("", response_model=ConversationOut, status_code=201)
def creer(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conv = Conversation(user_id=user.id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("", response_model=List[ConversationOut])
def lister(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.id.desc())
        .all()
    )


@router.get("/{conv_id}", response_model=ConversationDetail)
def detail(conv_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_owned(db, conv_id, user)


@router.delete("/{conv_id}", status_code=204)
def supprimer(conv_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conv = get_owned(db, conv_id, user)
    documents = db.query(Document).filter(Document.conversation_id == conv.id).all()
    try:
        for document in documents:
            remove_document(document.id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Suppression des supports impossible : {exc}")
    for document in documents:
        Path(document.chemin).unlink(missing_ok=True)
        db.delete(document)
    db.delete(conv)
    db.commit()
    return Response(status_code=204)


@router.post("/{conv_id}/messages", response_model=ChatResponse)
def envoyer(
    conv_id: int,
    data: MessageIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = get_owned(db, conv_id, user)
    question = data.contenu.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Le message est vide")

    historique = [{"role": m.role, "contenu": m.contenu} for m in conv.messages]
    if not historique:
        conv.titre = question[:50]  # le titre = début de la première question

    user_msg = Message(conversation_id=conv.id, role="user", contenu=question)
    db.add(user_msg)

    debut = time.perf_counter()
    try:
        a_des_documents = db.query(Document.id).filter(
            Document.user_id == user.id,
            (Document.conversation_id.is_(None)) | (Document.conversation_id == conv.id),
        ).first()
        sources = rechercher_supports(user.id, conv.id, question) if a_des_documents else []
        contexte = "\n\n".join(
            f"[Source {i}] {s['nom_fichier']}"
            + (f", page {s['page']}" if s["page"] else "")
            + f"\n{s['extrait']}"
            for i, s in enumerate(sources, 1)
        )
        texte, type_demande = generate_reply(historique, question, contexte)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Le modèle n'a pas répondu : {e}")
    duree_ms = int((time.perf_counter() - debut) * 1000)

    user_msg.type = type_demande
    bot_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        contenu=texte,
        type=type_demande,
        temps_reponse_ms=duree_ms,
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(conv)
    db.refresh(user_msg)
    db.refresh(bot_msg)

    return ChatResponse(conversation=conv, user_message=user_msg, assistant_message=bot_msg, sources=sources)
