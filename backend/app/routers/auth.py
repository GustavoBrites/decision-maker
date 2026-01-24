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

oauth2_scheme = Depends(lambda: "mock_token") # Placeholder if we used OAuth2Scheme

def get_current_user(token: str = Depends(oauth2_scheme)):
    # In a real app we decode the token
    # For this mock, we'll try to decode it if it looks like a real one, or fallback
    try:
        # If the token is just the "mock-jwt-token-UUID" string from api.ts, we extract the UUID if possible
        # But api.ts sends "Bearer <token>". FastAPI Depends might handle this if we use OAuth2PasswordBearer
        # Let's simple parse manually for now as we don't have full setup
        pass
    except:
        pass
        
    # Since we are using custom simple token in api.ts "mock-jwt-token-"+user.id
    # We can't easily extract user from it securely without looking up all users.
    # But wait, auth.py was creating a JWT: encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    # So we CAN decode it.
    
    # We need to handle the header extraction manually or use Header dependency if not using OAuth2PasswordBearer
    pass

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
             raise HTTPException(status_code=401, detail="Could not validate credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    user = db.get_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

