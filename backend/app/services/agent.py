from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from app.services.llm_service import appeler_llm
from app.services.prompts import PROMPT_CLASSIFICATION, SYSTEM_PROMPTS, TYPES


class EtatChat(TypedDict):
    historique: list
    question: str
    type: str
    reponse: str


def detect_type_mots_cles(question: str) -> str:
    """Plan B si la classification par le LLM échoue."""
    q = question.lower()
    if "qcm" in q:
        return "qcm"
    if "exercice" in q or "corrig" in q:
        return "exercice"
    if "résum" in q or "resum" in q:
        return "resume"
    if "tradui" in q or "traduc" in q or "translate" in q:
        return "traduction"
    if "code" in q:
        return "code"
    if any(m in q for m in ["explique", "cours", "c'est quoi", "définition"]):
        return "cours"
    return "general"


def noeud_classifier(etat: EtatChat):
    try:
        rep = appeler_llm(PROMPT_CLASSIFICATION, [], etat["question"], temperature=0).strip().lower()
        type_demande = next((t for t in TYPES if t in rep), None)
    except Exception:
        type_demande = None
    return {"type": type_demande or detect_type_mots_cles(etat["question"])}


def noeud_generer(etat: EtatChat):
    prompt = SYSTEM_PROMPTS.get(etat["type"], SYSTEM_PROMPTS["general"])
    reponse = appeler_llm(prompt, etat["historique"], etat["question"])
    return {"reponse": reponse}


_graphe = StateGraph(EtatChat)
_graphe.add_node("classifier", noeud_classifier)
_graphe.add_node("generer", noeud_generer)
_graphe.add_edge(START, "classifier")
_graphe.add_edge("classifier", "generer")
_graphe.add_edge("generer", END)
graphe = _graphe.compile()


def repondre(historique: list, question: str):
    resultat = graphe.invoke(
        {"historique": historique, "question": question, "type": "", "reponse": ""}
    )
    return resultat["reponse"], resultat["type"]