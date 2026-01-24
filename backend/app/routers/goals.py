from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from ..models import WeeklyGoal, CreateGoalRequest, UpdateGoalRequest, User
from ..db import db
from .auth import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("", response_model=List[WeeklyGoal])
def get_goals(user: User = Depends(get_current_user)):
    return db.get_goals(user.id)

@router.post("", response_model=WeeklyGoal, status_code=201)
def create_goal(request: CreateGoalRequest, user: User = Depends(get_current_user)):
    return db.create_goal(request, user.id)

@router.put("/{id}", response_model=WeeklyGoal)
def update_goal(id: UUID, request: UpdateGoalRequest, user: User = Depends(get_current_user)):
    goal = db.get_goal(id)
    if not goal or goal.userId != user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if request.title is not None:
        goal.title = request.title
    if request.targetMinutes is not None:
        goal.targetMinutes = request.targetMinutes
        
    return db.update_goal(id, goal)

@router.delete("/{id}")
def delete_goal(id: UUID, user: User = Depends(get_current_user)):
    # Check minimum goals requirement if needed, for now just delete
    # First check ownership
    goal = db.get_goal(id)
    if not goal or goal.userId != user.id:
        raise HTTPException(status_code=404, detail="Goal not found")

    if not db.delete_goal(id):
         raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}
