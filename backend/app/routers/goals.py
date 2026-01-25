from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..models import WeeklyGoal, CreateGoalRequest, UpdateGoalRequest, User
from ..database import get_db
from ..db_models import WeeklyGoalDB
from .auth import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])


def goal_db_to_pydantic(goal_db: WeeklyGoalDB) -> WeeklyGoal:
    """Convert SQLAlchemy WeeklyGoalDB to Pydantic WeeklyGoal model."""
    return WeeklyGoal(
        id=UUID(goal_db.id),
        userId=UUID(goal_db.user_id),
        title=goal_db.title,
        type=goal_db.type,
        targetMinutes=goal_db.target_minutes,
        completedMinutes=goal_db.completed_minutes
    )


@router.get("", response_model=List[WeeklyGoal])
def get_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(WeeklyGoalDB).filter(WeeklyGoalDB.user_id == str(user.id)).all()
    return [goal_db_to_pydantic(g) for g in goals]


@router.post("", response_model=WeeklyGoal, status_code=201)
def create_goal(request: CreateGoalRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal_db = WeeklyGoalDB(
        user_id=str(user.id),
        title=request.title,
        type=request.type.value,
        target_minutes=request.targetMinutes,
        completed_minutes=0
    )
    db.add(goal_db)
    db.commit()
    db.refresh(goal_db)
    return goal_db_to_pydantic(goal_db)


@router.put("/{id}", response_model=WeeklyGoal)
def update_goal(id: UUID, request: UpdateGoalRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal_db = db.query(WeeklyGoalDB).filter(WeeklyGoalDB.id == str(id)).first()
    if not goal_db or goal_db.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if request.title is not None:
        goal_db.title = request.title
    if request.targetMinutes is not None:
        goal_db.target_minutes = request.targetMinutes
    
    db.commit()
    db.refresh(goal_db)
    return goal_db_to_pydantic(goal_db)


@router.delete("/{id}")
def delete_goal(id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal_db = db.query(WeeklyGoalDB).filter(WeeklyGoalDB.id == str(id)).first()
    if not goal_db or goal_db.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(goal_db)
    db.commit()
    return {"message": "Goal deleted"}
