from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID
import jwt
from datetime import datetime, timedelta

from ..models import User, CreateUserRequest, LoginRequest, Token
from ..database import get_db
from ..db_models import UserDB

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = "mock_secret_key"
ALGORITHM = "HS256"

security = HTTPBearer()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def user_db_to_pydantic(user_db: UserDB) -> User:
    """Convert SQLAlchemy UserDB to Pydantic User model."""
    return User(id=UUID(user_db.id), username=user_db.username, email=user_db.email)


@router.post("/signup", response_model=Token)
def signup(request: CreateUserRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(UserDB).filter(UserDB.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    user_db = UserDB(
        username=request.username,
        email=request.email,
        password_hash=request.password  # In production, hash this!
    )
    db.add(user_db)
    db.commit()
    db.refresh(user_db)
    
    user = user_db_to_pydantic(user_db)
    token = create_access_token({"sub": user.email})
    return Token(user=user, token=token)


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user_db = db.query(UserDB).filter(UserDB.email == request.email).first()
    if not user_db or user_db.password_hash != request.password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    user = user_db_to_pydantic(user_db)
    token = create_access_token({"sub": user.email})
    return Token(user=user, token=token)


@router.post("/logout")
def logout():
    return {"message": "Successful logout"}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user_db = db.query(UserDB).filter(UserDB.email == email).first()
    if user_db is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_db_to_pydantic(user_db)


@router.get("/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
