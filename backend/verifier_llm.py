import requests
from app.config import settings

print("LLM_PROVIDER :", settings.LLM_PROVIDER)
print("Clé Gemini renseignée :", bool(settings.GEMINI_API_KEY))
print("Clé Groq renseignée   :", bool(settings.GROQ_API_KEY))

if settings.GROQ_API_KEY:
    print("\nModèles Groq disponibles pour ta clé :")
    r = requests.get(
        "https://api.groq.com/openai/v1/models",
        headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
        timeout=20,
    )
    if r.ok:
        for nom in sorted(m["id"] for m in r.json()["data"]):
            print(" -", nom)
    else:
        print("Erreur", r.status_code, r.text[:200])

if settings.GEMINI_API_KEY:
    print("\nModèles Gemini disponibles pour ta clé :")
    r = requests.get(
        "https://generativelanguage.googleapis.com/v1beta/models",
        params={"key": settings.GEMINI_API_KEY},
        timeout=20,
    )
    if r.ok:
        for m in r.json().get("models", []):
            if "generateContent" in m.get("supportedGenerationMethods", []) and "gemini" in m["name"]:
                print(" -", m["name"].replace("models/", ""))
    else:
        print("Erreur", r.status_code)