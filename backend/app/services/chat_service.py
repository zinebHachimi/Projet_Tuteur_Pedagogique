def detect_type(question: str) -> str:
    q = question.lower()
    if "qcm" in q:
        return "qcm"
    if "exercice" in q:
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


def generate_reply(historique: list, question: str):
    """Réponse provisoire. Sera remplacée par le LLM à l'étape 4."""
    type_demande = detect_type(question)
    texte = f"[Réponse provisoire - type détecté : {type_demande}] Tu as demandé : {question}"
    return texte, type_demande