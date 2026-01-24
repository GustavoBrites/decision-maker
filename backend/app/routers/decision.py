from fastapi import APIRouter, Query, Depends
from typing import Optional
from ..models import Recommendation, EnergyLevel, User
from ..db import db
from .auth import get_current_user
import random

router = APIRouter(prefix="/decision", tags=["Decision"])

@router.get("/recommendation", response_model=Recommendation)
def get_recommendation(
    availableMinutes: int = Query(..., ge=0),
    energyLevel: EnergyLevel = Query(...),
    user: User = Depends(get_current_user)
):
    tasks = db.get_tasks(user.id)
    
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
        # Return a dummy task or handle error better in real app
        # For now, let's just return a placeholder or error if strictly needed
        # But the schema requires a task.
        # Let's create a "Free Time" task dynamically if nothing else matches
        from ..models import Task
        from uuid import uuid4
        free_time = Task(
             id=uuid4(),
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

    # Pick a random one for now, or sort by priority
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
