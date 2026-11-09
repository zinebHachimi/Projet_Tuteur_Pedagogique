from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.config import settings


def _construire(provider: str, temperature: float):
    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=temperature,
        )
    if provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=temperature,
        )
    raise ValueError(f"Fournisseur inconnu : {provider}")


def _fournisseurs_disponibles():
    """Fournisseur principal d'abord, l'autre en secours (seulement s'il a une clé)."""
    autre = "groq" if settings.LLM_PROVIDER == "gemini" else "gemini"
    cles = {"gemini": settings.GEMINI_API_KEY, "groq": settings.GROQ_API_KEY}
    return [p for p in (settings.LLM_PROVIDER, autre) if cles.get(p)]


def _en_texte(contenu) -> str:
    """Certains modèles renvoient une liste de morceaux au lieu d'un texte."""
    if isinstance(contenu, str):
        return contenu
    morceaux = []
    for m in contenu:
        morceaux.append(m if isinstance(m, str) else m.get("text", ""))
    return "".join(morceaux)


def appeler_llm(system_prompt: str, historique: list, question: str, temperature: float = 0.4) -> str:
    messages = [SystemMessage(content=system_prompt)]
    for m in historique[-10:]:  # on garde les 10 derniers messages
        if m["role"] == "user":
            messages.append(HumanMessage(content=m["contenu"]))
        else:
            messages.append(AIMessage(content=m["contenu"]))
    messages.append(HumanMessage(content=question))

    fournisseurs = _fournisseurs_disponibles()
    if not fournisseurs:
        raise RuntimeError("Aucune clé API trouvée dans le fichier .env")

    erreurs = []
    for provider in fournisseurs:
        try:
            reponse = _construire(provider, temperature).invoke(messages)
            return _en_texte(reponse.content)
        except Exception as e:
            erreurs.append(f"{provider} : {e}")

    raise RuntimeError(" | ".join(erreurs))