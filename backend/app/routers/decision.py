from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import uuid4, UUID
import random

from ..models import Recommendation, EnergyLevel, User, Task
from ..database import get_db
from ..db_models import TaskDB
from .auth import get_current_user

router = APIRouter(prefix="/decision", tags=["Decision"])


def task_db_to_pydantic(task_db: TaskDB) -> Task:
    """Convert SQLAlchemy TaskDB to Pydantic Task model."""
    return Task(
        id=UUID(task_db.id),
        userId=UUID(task_db.user_id),
        title=task_db.title,
        estimatedMinutes=task_db.estimated_minutes,
        energy=task_db.energy,
        goalId=UUID(task_db.goal_id) if task_db.goal_id else None,
        completed=task_db.completed,
        completedMinutes=task_db.completed_minutes
    )


@router.get("/recommendation", response_model=Recommendation)
def get_recommendation(
    availableMinutes: int = Query(..., ge=0),
    energyLevel: EnergyLevel = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task_dbs = db.query(TaskDB).filter(TaskDB.user_id == str(user.id)).all()
    tasks = [task_db_to_pydantic(t) for t in task_dbs]
    
    # Simple recommendation logic
    suitable_tasks = [
        t for t in tasks 
        if not t.completed 
        and t.energy == energyLevel 
        and t.estimatedMinutes <= availableMinutes
    ]
    
    if not suitable_tasks:
        # Try finding something with lower energy requirement if user has high energy
        if energyLevel == EnergyLevel.high:
            suitable_tasks = [
                t for t in tasks 
                if not t.completed 
                and t.energy in [EnergyLevel.medium, EnergyLevel.low]
                and t.estimatedMinutes <= availableMinutes
            ]
        elif energyLevel == EnergyLevel.medium:
            suitable_tasks = [
                t for t in tasks 
                if not t.completed 
                and t.energy == EnergyLevel.low
                and t.estimatedMinutes <= availableMinutes
            ]

    if not suitable_tasks:
        # Return a "Free Time" task dynamically if nothing else matches
        free_time = Task(
            id=uuid4(),
            userId=user.id,
            title="Relax and Recharge",
            estimatedMinutes=availableMinutes,
            energy=EnergyLevel.low,
            completed=False,
            completedMinutes=0
        )
        return Recommendation(
            task=free_time,
            reason="No specific tasks match your criteria. Take some time for yourself!",
            alternative=None,
            alternativeReason=None
        )

    # Pick a random one for now
    selected_task = random.choice(suitable_tasks)
    
    # Find an alternative
    alternative_tasks = [t for t in suitable_tasks if t.id != selected_task.id]
    alternative = random.choice(alternative_tasks) if alternative_tasks else None
    
    return Recommendation(
        task=selected_task,
        reason="It fits your energy level and time constraints.",
        alternative=alternative,
        alternativeReason="Here is another option just in case." if alternative else None
    )
