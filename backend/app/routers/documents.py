from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import get_current_user
from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.chat import DocumentOut
from app.services.rag_service import extract_pages, index_document, remove_document
from app.models.conversation import Conversation

router = APIRouter(prefix="/documents", tags=["Supports de cours (RAG)"])
DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "uploads"
FORMATS_ACCEPTES = {".pdf", ".txt"}


def get_owned_document(db: Session, document_id: int, user: User) -> Document:
    document = db.query(Document).filter(
        Document.id == document_id, Document.user_id == user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return document


def get_owned_conversation(db: Session, conversation_id: int, user: User) -> Conversation:
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id, Conversation.user_id == user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Discussion introuvable")
    return conversation


@router.post("", response_model=DocumentOut, status_code=201)
async def importer(
    fichier: UploadFile = File(...),
    conversation_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    nom = Path(fichier.filename or "").name
    suffix = Path(nom).suffix.lower()
    if suffix not in FORMATS_ACCEPTES:
        raise HTTPException(status_code=415, detail="Formats acceptés : PDF et fichier texte .txt")
    if conversation_id is not None:
        get_owned_conversation(db, conversation_id, user)

    contenu = await fichier.read(settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024 + 1)
    if not contenu:
        raise HTTPException(status_code=400, detail="Le fichier est vide")
    if len(contenu) > settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Taille maximale : {settings.MAX_DOCUMENT_SIZE_MB} Mo")

    dossier = DATA_DIR / f"user_{user.id}"
    dossier.mkdir(parents=True, exist_ok=True)
    chemin = dossier / f"{uuid4().hex}{suffix}"
    chemin.write_bytes(contenu)
    try:
        pages = extract_pages(chemin, suffix)
    except Exception as exc:
        chemin.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Lecture du document impossible : {exc}")

    document = Document(
        user_id=user.id,
        conversation_id=conversation_id,
        nom_fichier=nom[:255],
        chemin=str(chemin),
    )
    try:
        db.add(document)
        db.flush()
        index_document(document.id, user.id, conversation_id, document.nom_fichier, pages)
        db.commit()
        db.refresh(document)
    except Exception as exc:
        db.rollback()
        chemin.unlink(missing_ok=True)
        try:
            if document.id:
                remove_document(document.id)
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=f"Indexation du document impossible : {exc}")
    return document


@router.get("", response_model=list[DocumentOut])
def lister(
    conversation_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Document).filter(Document.user_id == user.id)
    if conversation_id is not None:
        get_owned_conversation(db, conversation_id, user)
        query = query.filter((Document.conversation_id.is_(None)) | (Document.conversation_id == conversation_id))
    return query.order_by(Document.created_at.desc()).all()


@router.delete("/{document_id}", status_code=204)
def supprimer(
    document_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    document = get_owned_document(db, document_id, user)
    try:
        remove_document(document.id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Suppression de l'index impossible : {exc}")
    Path(document.chemin).unlink(missing_ok=True)
    db.delete(document)
    db.commit()
