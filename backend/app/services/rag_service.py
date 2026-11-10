"""Ingestion et recherche RAG dans les supports de cours des utilisateurs."""
from functools import lru_cache
from pathlib import Path

from app.config import settings


@lru_cache(maxsize=1)
def _vectorstore():
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("Configurez GEMINI_API_KEY pour indexer et rechercher les cours.")
    from langchain_chroma import Chroma
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    embeddings = GoogleGenerativeAIEmbeddings(
        model=settings.GEMINI_EMBEDDING_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
    )
    directory = Path(__file__).resolve().parents[2] / "data" / "rag_index"
    directory.mkdir(parents=True, exist_ok=True)
    return Chroma(
        collection_name="supports_de_cours",
        embedding_function=embeddings,
        persist_directory=str(directory),
    )


def extract_pages(path: Path, suffix: str) -> list[tuple[int | None, str]]:
    if suffix == ".pdf":
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        if reader.is_encrypted:
            raise ValueError("Le PDF est protégé par un mot de passe.")
        pages = [(number, page.extract_text() or "") for number, page in enumerate(reader.pages, 1)]
    else:
        pages = [(None, path.read_text(encoding="utf-8-sig"))]
    pages = [(number, text.strip()) for number, text in pages if text.strip()]
    if not pages:
        raise ValueError("Aucun texte exploitable trouvé dans ce document.")
    return pages


def index_document(document_id: int, user_id: int, conversation_id: int | None,
                   filename: str, pages: list[tuple[int | None, str]]) -> None:
    from langchain_core.documents import Document as LCDocument
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=max(200, settings.RAG_CHUNK_SIZE),
        chunk_overlap=min(settings.RAG_CHUNK_OVERLAP, max(0, settings.RAG_CHUNK_SIZE - 1)),
        add_start_index=True,
    )
    chunks = []
    for page, text in pages:
        metadata = {
            "document_id": document_id,
            "owner_id": user_id,
            "conversation_id": conversation_id or 0,
            "filename": filename,
        }
        if page is not None:
            metadata["page"] = page
        chunks.extend(splitter.create_documents([text], metadatas=[metadata]))
    if not chunks:
        raise ValueError("Le document ne contient pas de passage indexable.")
    ids = [f"doc-{document_id}-chunk-{i}" for i in range(len(chunks))]
    _vectorstore().add_documents(chunks, ids=ids)


def remove_document(document_id: int) -> None:
    _vectorstore().delete(where={"document_id": document_id})


def search(user_id: int, conversation_id: int, question: str) -> list[dict]:
    """Renvoie les passages autorisés, priorisant les documents de cette discussion."""
    try:
        found = _vectorstore().similarity_search(
            question,
            k=max(1, settings.RAG_TOP_K),
            filter={"$and": [
                {"owner_id": user_id},
                {"$or": [
                    {"conversation_id": 0},
                    {"conversation_id": conversation_id},
                ]},
            ]},
        )
    except Exception as exc:
        raise RuntimeError(f"Recherche dans les supports impossible : {exc}") from exc

    allowed = found
    allowed.sort(key=lambda doc: int(doc.metadata.get("conversation_id", 0)) != conversation_id)
    result = []
    for doc in allowed[: max(1, settings.RAG_TOP_K)]:
        result.append({
            "document_id": int(doc.metadata["document_id"]),
            "nom_fichier": doc.metadata.get("filename", "Support de cours"),
            "page": doc.metadata.get("page"),
            "extrait": doc.page_content,
        })
    return result
