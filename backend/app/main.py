from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, tasks, goals, decision
from .database import Base, engine
from . import db_models  # noqa: F401 - Import to register models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Decision Maker API",
    description="Backend API for the Decision Maker application",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(decision.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to Decision Maker API"}
