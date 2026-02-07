from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routes_auth import router as auth_router
from routes_profile import router as profile_router
from routes_admin import router as admin_router
from routes_materials import router as materials_router
from routes_math import router as math_router
from routes_quiz import router as quiz_router
from routes_vocabulary import router as vocabulary_router

app = FastAPI(title="Tymonteam.pl API", version="0.1.0")

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, tags=["auth"])
app.include_router(profile_router, tags=["profile"])
app.include_router(admin_router, tags=["admin"])
app.include_router(materials_router, tags=["materials"])
app.include_router(math_router, tags=["math"])
app.include_router(quiz_router, tags=["quiz"])
app.include_router(vocabulary_router, tags=["vocabulary"])


@app.get("/")
async def root():
    return {"message": "Tymonteam.pl API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
