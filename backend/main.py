
from contextlib import asynccontextmanager
import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash
from pymongo.errors import DuplicateKeyError
from fastapi.middleware.cors import CORSMiddleware

from database import client, db


# Proteger les mots de passe avec Argon2
password_hash = PasswordHash.recommended()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
security = HTTPBearer()

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY manquante dans .env")


# Informations demandees pour l'inscription
class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Preparer MongoDB au demarrage
@asynccontextmanager
async def lifespan(app: FastAPI):
    await db["users"].create_index("email", unique=True)
    yield
    await client.close()


app = FastAPI(title="StudyMind API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def accueil():
    return {"message": "Bienvenue sur StudyMind"}


@app.get("/health")
def health():
    return {"status": "ok"}


# API pour creer un compte
@app.post("/auth/register", status_code=201)
async def register(user: RegisterRequest):

    name = user.name.strip()
    if len(name) < 2:
        raise HTTPException(422, "Nom invalide")

    email = str(user.email).lower()

    # Hacher le mot de passe
    hashed_password = password_hash.hash(user.password)

    # Preparer les donnees MongoDB
    new_user = {
        "name": name,
        "email": email,
        "hashed_password": hashed_password
    }

    try:
        result = await db["users"].insert_one(new_user)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Cet email est deja utilise"
        )

    return {
        "id": str(result.inserted_id),
        "name": name,
        "email": email,
        "message": "Compte cree avec succes"
    }


@app.post("/auth/login")
async def login(data: LoginRequest):

    # 1. Chercher l'utilisateur dans MongoDB
    user = await db["users"].find_one({
        "email": str(data.email).lower()
    })

    # 2. Verifier l'email et le mot de passe
    if not user or not password_hash.verify(
        data.password, user["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Email ou mot de passe incorrect"
        )

    # 3. Creer un token JWT valable 60 minutes
    expiration = datetime.now(timezone.utc) + timedelta(minutes=60)

    token = jwt.encode(
        {
            "sub": str(user["_id"]),
            "exp": expiration
        },
        JWT_SECRET_KEY,
        algorithm="HS256"
    )

    # 4. Retourner le token
    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Connexion reussie"
    }


@app.get("/auth/me")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Recuperer et verifier le token
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        user_id = payload.get("sub")

        if not user_id or not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=401,
                detail="Token invalide"
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Session expiree"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token invalide"
        )

    # Chercher l'utilisateur dans MongoDB
    user = await db["users"].find_one({
        "_id": ObjectId(user_id)
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Utilisateur introuvable"
        )

    # Retourner seulement les informations publiques
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"]
    }

