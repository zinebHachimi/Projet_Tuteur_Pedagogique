from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    nom: str
    email: EmailStr
    mot_de_passe: str


class UserLogin(BaseModel):
    email: EmailStr
    mot_de_passe: str


class UserOut(BaseModel):
    id: int
    nom: str
    email: EmailStr
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut