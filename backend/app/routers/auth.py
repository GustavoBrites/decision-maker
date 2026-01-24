from fastapi import APIRouter, HTTPException, Depends
from ..models import User, CreateUserRequest, LoginRequest, Token
from ..db import db
import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = "mock_secret_key"
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/signup", response_model=Token)
def signup(request: CreateUserRequest):
    try:
        user = db.create_user(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    token = create_access_token({"sub": user.email})
    return Token(user=user, token=token)

@router.post("/login", response_model=Token)
def login(request: LoginRequest):
    user = db.get_user_by_email(request.email)
    if not user or not db.verify_password(request.email, request.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.email})
    return Token(user=user, token=token)

@router.post("/logout")
def logout():
    return {"message": "Successful logout"}

@router.get("/me", response_model=User)
def get_me(token: str = "mock_token"): # Simplified for mock
    # In a real app, we'd validate the Bearer token here
    # For now, just return the first user or a mock user
    users = list(db.users.values())
    if users:
       return users[0]
    # Create a default user if none exists for testing convenience
    try:
        return db.create_user(CreateUserRequest(username="test", email="test@example.com", password="password"))
    except ValueError:
        return db.get_user_by_email("test@example.com")

