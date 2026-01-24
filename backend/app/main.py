from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, tasks, goals, decision

app = FastAPI(
    title="Decision Maker API",
    description="Backend API for the Decision Maker application",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:3000",  # Frontend URL
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(goals.router)
app.include_router(decision.router)

@app.get("/")
def root():
    return {"message": "Welcome to Decision Maker API"}
