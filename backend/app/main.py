from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
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

# Serve static files from the frontend dist directory
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend/dist")

if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # If the path looks like a static file (has extension), try to serve it from dist
        if "." in full_path:
            file_path = os.path.join(frontend_dist_path, full_path)
            if os.path.exists(file_path):
                return FileResponse(file_path)
        
        # Otherwise, serve index.html for SPA routing
        index_path = os.path.join(frontend_dist_path, "index.html")
        return FileResponse(index_path)
else:
    @app.get("/")
    def root():
        return {"message": "Welcome to Decision Maker API (Frontend dist not found)"}
