import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from .database import Base


def generate_uuid():
    return str(uuid.uuid4())


class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    tasks = relationship("TaskDB", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("WeeklyGoalDB", back_populates="user", cascade="all, delete-orphan")


class WeeklyGoalDB(Base):
    __tablename__ = "weekly_goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)  # body, mind, soul, custom
    target_minutes = Column(Integer, nullable=False, default=0)
    completed_minutes = Column(Integer, nullable=False, default=0)

    user = relationship("UserDB", back_populates="goals")
    tasks = relationship("TaskDB", back_populates="goal")


class TaskDB(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    estimated_minutes = Column(Integer, nullable=False, default=0)
    energy = Column(String(20), nullable=False)  # low, medium, high
    goal_id = Column(String(36), ForeignKey("weekly_goals.id"), nullable=True)
    completed = Column(Boolean, nullable=False, default=False)
    completed_minutes = Column(Integer, nullable=False, default=0)

    user = relationship("UserDB", back_populates="tasks")
    goal = relationship("WeeklyGoalDB", back_populates="tasks")
