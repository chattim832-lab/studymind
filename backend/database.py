
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from pymongo import AsyncMongoClient

# Lire le fichier .env
load_dotenv(Path(__file__).parent / ".env")

# Recuperer la connexion MongoDB
MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI manquante dans .env")

# Creer la connexion
client = AsyncMongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=10000
)

# Choisir la base de donnees
db = client[os.getenv("MONGODB_DB", "studymind")]

# Tester la connexion
async def test_connection():
    try:
        await client.admin.command("ping")
        print("MongoDB connected successfully!")
    except Exception as error:
        print("Connection failed:", type(error).__name__)
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
