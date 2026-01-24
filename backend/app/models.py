from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum
from uuid import UUID

class EnergyLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class GoalType(str, Enum):
    body = "body"
    mind = "mind"
    soul = "soul"
    custom = "custom"

class User(BaseModel):
    id: UUID
    username: str
    email: EmailStr

class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    user: User
    token: str

class TaskBase(BaseModel):
    title: str
    estimatedMinutes: int = Field(ge=0)
    cost: float = Field(default=0.0, ge=0)
    goalId: Optional[UUID] = None
    energy: EnergyLevel

class CreateTaskRequest(TaskBase):
    pass

class Task(TaskBase):
    id: UUID
    completed: bool = False
    completedMinutes: int = Field(default=0, ge=0)

class WeeklyGoalBase(BaseModel):
    title: str
    type: GoalType
    targetMinutes: int = Field(ge=0)

class CreateGoalRequest(WeeklyGoalBase):
    pass

class UpdateGoalRequest(BaseModel):
    title: Optional[str] = None
    targetMinutes: Optional[int] = Field(None, ge=0)

class WeeklyGoal(WeeklyGoalBase):
    id: UUID
    completedMinutes: int = Field(default=0, ge=0)

class Recommendation(BaseModel):
    task: Task
    reason: str
    alternative: Optional[Task] = None
    alternativeReason: Optional[str] = None

class CompleteTaskRequest(BaseModel):
    actualMinutes: Optional[int] = None
