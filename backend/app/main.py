from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app import models  # noqa: F401  (pour que les tables soient connues)
from app.routers import auth, conversations, documents, profile

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tuteur pédagogique intelligent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # React + Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(profile.router)
app.include_router(documents.router)


@app.get("/")
def accueil():
    return {"message": "API du tuteur intelligent en marche"}
