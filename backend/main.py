
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
from fastapi import File, UploadFile
from gridfs import AsyncGridFSBucket
from io import BytesIO
from chat_service import answer_question_from_pdf
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

pdf_bucket = AsyncGridFSBucket(db)

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

# Modèle pour ajouter un cours
class CourseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)


# Ajouter un nouveau cours
@app.post("/courses", status_code=201)
async def create_course(
    course: CourseCreate,
    current_user: dict = Depends(get_current_user)
):
    title = course.title.strip()

    if not title:
        raise HTTPException(
            status_code=422,
            detail="Le titre du cours est obligatoire"
        )

    new_course = {
        "title": title,
        "description": course.description,
        "user_id": current_user["id"],
        "created_at": datetime.now(timezone.utc)
    }

    result = await db["courses"].insert_one(new_course)

    return {
        "id": str(result.inserted_id),
        "title": title,
        "description": course.description,
        "message": "Cours ajouté avec succès"
    }


# Afficher les cours de l'étudiant connecté
@app.get("/courses")
async def get_courses(
    current_user: dict = Depends(get_current_user)
):
    courses = []

    cursor = db["courses"].find(
        {"user_id": current_user["id"]}
    ).sort("created_at", -1)

    async for course in cursor:
        courses.append({
            "id": str(course["_id"]),
            "title": course["title"],
            "description": course["description"]
        })

    return courses


# Supprimer un cours

# Supprimer un cours et ses PDF
@app.delete("/courses/{course_id}")
async def delete_course(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    # 1. Vérifier l'identifiant du cours
    if not ObjectId.is_valid(course_id):
        raise HTTPException(
            status_code=400,
            detail="Identifiant du cours invalide"
        )

    # 2. Vérifier que le cours appartient à l'étudiant
    course_filter = {
        "_id": ObjectId(course_id),
        "user_id": current_user["id"]
    }

    course = await db["courses"].find_one(course_filter)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Cours introuvable"
        )

    # 3. Récupérer les identifiants des PDF associés
    pdf_ids = []

    cursor = db["fs.files"].find({
        "metadata.course_id": course_id,
        "metadata.user_id": current_user["id"]
    })

    async for pdf in cursor:
        pdf_ids.append(pdf["_id"])

    # 4. Supprimer les PDF de GridFS
    for pdf_id in pdf_ids:
        await pdf_bucket.delete(pdf_id)

    # 5. Supprimer le cours
    await db["courses"].delete_one(course_filter)

    return {
        "message": "Cours et PDF associés supprimés avec succès"
    }

    # Vérifier que l'identifiant est valide
    if not ObjectId.is_valid(course_id):
        raise HTTPException(
            status_code=400,
            detail="Identifiant du cours invalide"
        )

    # Supprimer uniquement un cours appartenant à l'étudiant
    result = await db["courses"].delete_one({
        "_id": ObjectId(course_id),
        "user_id": current_user["id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Cours introuvable"
        )

    return {
        "message": "Cours supprimé avec succès"
    }


# Ajouter un PDF à un cours
@app.post("/courses/{course_id}/pdfs", status_code=201)
async def upload_course_pdf(
    course_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Vérifier l'identifiant du cours
    if not ObjectId.is_valid(course_id):
        raise HTTPException(
            status_code=400,
            detail="Identifiant du cours invalide"
        )

    # Vérifier que le cours appartient à l'étudiant
    course = await db["courses"].find_one({
        "_id": ObjectId(course_id),
        "user_id": current_user["id"]
    })

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Cours introuvable"
        )

    # Vérifier le nom du fichier
    filename = (file.filename or "").replace("\\", "/").split("/")[-1]

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF sont acceptés"
        )

    # Lire le fichier avec une limite de 10 Mo
    max_size = 10 * 1024 * 1024
    content = await file.read(max_size + 1)
    await file.close()

    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail="Le PDF ne doit pas dépasser 10 Mo"
        )

    # Vérifier la signature de base d'un PDF
    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Fichier PDF invalide"
        )

    # Stocker le PDF dans MongoDB GridFS
    file_id = await pdf_bucket.upload_from_stream(
        filename,
        BytesIO(content),
        metadata={
            "course_id": course_id,
            "user_id": current_user["id"],
            "content_type": "application/pdf"
        }
    )

    return {
        "id": str(file_id),
        "filename": filename,
        "course_id": course_id,
        "message": "PDF ajouté avec succès"
    }


# Afficher les PDF d'un cours
@app.get("/courses/{course_id}/pdfs")
async def get_course_pdfs(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Vérifier l'identifiant du cours
    if not ObjectId.is_valid(course_id):
        raise HTTPException(
            status_code=400,
            detail="Identifiant du cours invalide"
        )

    # Vérifier que le cours appartient à l'étudiant
    course = await db["courses"].find_one({
        "_id": ObjectId(course_id),
        "user_id": current_user["id"]
    })

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Cours introuvable"
        )

    # Récupérer les PDF associés au cours
    pdfs = []

    cursor = db["fs.files"].find({
        "metadata.course_id": course_id,
        "metadata.user_id": current_user["id"]
    }).sort("uploadDate", -1)

    async for pdf in cursor:
        pdfs.append({
            "id": str(pdf["_id"]),
            "filename": pdf["filename"],
            "size_bytes": pdf["length"]
        })

    return pdfs


# Modele de la question du chatbot
class ChatRequest(BaseModel):
    course_id: str
    pdf_id: str
    question: str = Field(min_length=1, max_length=2000)


# API Chatbot StudyMind
@app.post("/chat")
async def chat_with_pdf(
    data: ChatRequest,
    current_user: dict = Depends(get_current_user)
):

    # 1. Verifier les identifiants
    if not ObjectId.is_valid(data.course_id):
        raise HTTPException(
            status_code=400,
            detail="Identifiant du cours invalide"
        )

    if not ObjectId.is_valid(data.pdf_id):
        raise HTTPException(
            status_code=400,
            detail="Identifiant du PDF invalide"
        )

    # 2. Verifier la question
    if not data.question.strip():
        raise HTTPException(
            status_code=422,
            detail="La question est obligatoire"
        )

    # 3. Lire le PDF et generer une reponse avec Gemini
    try:
        result = await answer_question_from_pdf(
            pdf_id=data.pdf_id,
            course_id=data.course_id,
            user_id=current_user["id"],
            question=data.question
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        ) from error

    # 4. Retourner la reponse et les pages sources
    return result




