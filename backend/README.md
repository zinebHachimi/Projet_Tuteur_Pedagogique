# API du tuteur pédagogique

## Lancer le backend

Avec PostgreSQL démarré et la base restaurée, ouvre PowerShell dans `backend` et exécute :

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Dans `.env`, renseigne `DATABASE_URL`, `SECRET_KEY` et `GEMINI_API_KEY`. L’exemple de connexion utilise la base `projet_Asisstant_pedagogique`; le nom doit correspondre exactement à celui affiché dans pgAdmin. PostgreSQL doit être démarré avant le lancement.

Lance l’API depuis ce dossier avec :

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

La documentation interactive est disponible sur `http://localhost:8000/docs`.

Gemini sert à la génération si `LLM_PROVIDER=gemini`, ou aux embeddings RAG dans tous les cas. Groq peut rester le modèle de génération principal ou de secours, mais ne remplace pas la clé Gemini nécessaire à l'indexation et à la recherche vectorielle.

## Supports de cours (RAG)

- `POST /documents?conversation_id=ID` : importer un PDF ou un fichier `.txt` (multipart, champ `fichier`). Sans identifiant de discussion, le support est disponible dans toutes les discussions du propriétaire.
- `GET /documents` : lister ses supports. Avec `conversation_id`, inclut les supports personnels et ceux de cette discussion.
- `DELETE /documents/{id}` : supprimer le support et ses vecteurs.
- `POST /conversations/{id}/messages` : les passages pertinents des supports accessibles sont ajoutés au contexte du tuteur; la réponse renvoie `sources` avec nom du fichier, page éventuelle et extrait.

Tous ces endpoints demandent le jeton Bearer obtenu via `/auth/login` ou `/auth/register`. Les fichiers originaux et l'index Chroma persistant sont stockés sous `backend/data/`, dossier ignoré par Git. La limite de taille, le découpage, le chevauchement et le nombre de passages retournés se règlent avec `MAX_DOCUMENT_SIZE_MB`, `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP` et `RAG_TOP_K` dans `.env`.

Les PDF scannés sans couche texte ne peuvent pas être indexés par cette version. Les fichiers contenant du texte sélectionnable et les fichiers texte UTF-8 sont pris en charge.

## Lancer le frontend

Dans un second terminal, depuis le dossier `frontend`, exécute `npm install`, puis `npm run dev`. Ouvre ensuite `http://localhost:5173`. Par défaut, l'interface appelle l'API sur `http://localhost:8000`; définis `VITE_API_URL` si l'API tourne ailleurs.

L'interface permet de créer un compte ou de se connecter, gérer les discussions, envoyer des questions, importer/supprimer des supports et consulter les extraits sources renvoyés avec les réponses. Le dépôt ne contient actuellement pas de migration frontend historique; ce client Vite est la première interface du projet.
