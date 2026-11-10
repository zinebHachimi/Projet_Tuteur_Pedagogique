import re
from functools import lru_cache
from langdetect import detect, DetectorFactory
from transformers import pipeline

DetectorFactory.seed = 0

# Modèle de résumé du TP du prof (anglais)
MODELE_RESUME = "cnicu/t5-small-booksum"

# Modèles de traduction (famille du TP : Helsinki-NLP/opus-mt)
MODELES_TRADUCTION = {
    ("fr", "en"): "Helsinki-NLP/opus-mt-fr-en",
    ("en", "fr"): "Helsinki-NLP/opus-mt-en-fr",
    ("es", "en"): "Helsinki-NLP/opus-mt-es-en",
    ("en", "es"): "Helsinki-NLP/opus-mt-en-es",
}

LANGUES = {
    "anglais": "en", "english": "en",
    "français": "fr", "francais": "fr", "french": "fr",
    "espagnol": "es", "spanish": "es",
}

# Préfixes Markdown conservés tels quels (titres, listes, citations)
PREFIXE_MARKDOWN = re.compile(r"^\s*(?:#{1,6}\s+|[-*+]\s+|>\s+|\d+[.)]\s+)*")


@lru_cache(maxsize=3)  # garde 3 modèles en mémoire au maximum
def _pipeline(tache: str, modele: str):
    return pipeline(tache, model=modele)


def detecter_langue(texte: str) -> str:
    try:
        return detect(texte)
    except Exception:
        return "fr"


def langue_demandee(question: str):
    """Cherche une langue cible dans la demande (ex. 'traduis en anglais')."""
    q = question.lower()
    for mot, code in LANGUES.items():
        if mot in q:
            return code
    return None


def _decouper(texte: str, max_car: int = 400):
    """Découpe un long paragraphe en morceaux (par phrases)."""
    phrases = re.split(r"(?<=[.!?])\s+", texte.strip())
    morceaux, courant = [], ""
    for p in phrases:
        if courant and len(courant) + len(p) > max_car:
            morceaux.append(courant)
            courant = p
        else:
            courant = (courant + " " + p).strip()
    if courant:
        morceaux.append(courant)
    return morceaux


def _traduire_segments(segments: list, source: str, cible: str) -> list:
    if source == cible:
        return segments
    if (source, cible) in MODELES_TRADUCTION:
        traducteur = _pipeline("translation", MODELES_TRADUCTION[(source, cible)])
        sorties = traducteur(segments, max_length=512, batch_size=8)
        return [s["translation_text"] for s in sorties]
    if source != "en" and cible != "en":  # passage par l'anglais
        return _traduire_segments(_traduire_segments(segments, source, "en"), "en", cible)
    raise ValueError(f"Paire de langues non prise en charge : {source} -> {cible}")


def traduire_texte(texte: str, cible: str):
    """Traduit un texte en gardant le Markdown et les blocs de code.
    Retourne (texte traduit, langue source détectée)."""
    source = detecter_langue(texte)
    blocs = []  # ["brut", ligne] ou ["texte", prefixe, contenu]
    dans_code = False

    for ligne in texte.split("\n"):
        if ligne.strip().startswith("```"):
            dans_code = not dans_code
            blocs.append(["brut", ligne])
            continue
        if dans_code or not ligne.strip():
            blocs.append(["brut", ligne])
            continue
        prefixe = PREFIXE_MARKDOWN.match(ligne).group(0)
        contenu = ligne[len(prefixe):].strip()
        precedent = blocs[-1] if blocs else None
        suite_de_paragraphe = (
            not prefixe
            and precedent is not None
            and precedent[0] == "texte"
            and not precedent[1].lstrip().startswith("#")
        )
        if suite_de_paragraphe:
            precedent[2] += " " + contenu
        else:
            blocs.append(["texte", prefixe, contenu])

    segments, proprietaires = [], []
    for k, bloc in enumerate(blocs):
        if bloc[0] == "texte":
            for morceau in _decouper(bloc[2]):
                segments.append(morceau)
                proprietaires.append(k)

    parties = {}
    if segments:
        traductions = _traduire_segments(segments, source, cible)
        for k, t in zip(proprietaires, traductions):
            parties.setdefault(k, []).append(t)

    lignes = []
    for k, bloc in enumerate(blocs):
        if bloc[0] == "brut":
            lignes.append(bloc[1])
        else:
            lignes.append(bloc[1] + " ".join(parties.get(k, [bloc[2]])))
    return "\n".join(lignes), source


def resumer_texte(texte: str, mots_par_bloc: int = 300, max_blocs: int = 10) -> str:
    """Résumé par blocs avec le modèle du TP (anglais), avec aller-retour de traduction."""
    propre = re.sub(r"```.*?```", " ", texte, flags=re.S)
    propre = re.sub(r"[#*>`]", " ", propre)
    langue = detecter_langue(propre)

    if langue != "en" and (langue, "en") in MODELES_TRADUCTION:
        propre = traduire_texte(propre, "en")[0]

    mots = propre.split()
    blocs = [" ".join(mots[i:i + mots_par_bloc]) for i in range(0, len(mots), mots_par_bloc)]
    blocs = blocs[:max_blocs]

    resumeur = _pipeline("summarization", MODELE_RESUME)
    points = []
    for bloc in blocs:
        n = len(bloc.split())
        if n < 40:
            points.append(bloc)
            continue
        sortie = resumeur(bloc, max_new_tokens=80, min_length=min(20, n // 3), do_sample=False)
        points.append(sortie[0]["summary_text"].strip())

    resume_en = "\n".join(f"- {p}" for p in points)
    if langue != "en" and ("en", langue) in MODELES_TRADUCTION:
        return traduire_texte(resume_en, langue)[0]
    return resume_en