from fastapi import APIRouter, HTTPException
from typing import List
from uuid import UUID
from ..models import WeeklyGoal, CreateGoalRequest, UpdateGoalRequest
from ..db import db

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("", response_model=List[WeeklyGoal])
def get_goals():
    return db.get_goals()

@router.post("", response_model=WeeklyGoal, status_code=201)
def create_goal(request: CreateGoalRequest):
    return db.create_goal(request)

@router.put("/{id}", response_model=WeeklyGoal)
def update_goal(id: UUID, request: UpdateGoalRequest):
    goal = db.get_goal(id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if request.title is not None:
        goal.title = request.title
    if request.targetMinutes is not None:
        goal.targetMinutes = request.targetMinutes
        
    return db.update_goal(id, goal)

@router.delete("/{id}")
def delete_goal(id: UUID):
    # Check minimum goals requirement if needed, for now just delete
    if not db.delete_goal(id):
         raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}
