from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    LLM_PROVIDER: str = "gemini"
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    RAG_CHUNK_SIZE: int = 1000
    RAG_CHUNK_OVERLAP: int = 150
    RAG_TOP_K: int = 5
    MAX_DOCUMENT_SIZE_MB: int = 20

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
