from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from ..models import Task, CreateTaskRequest, CompleteTaskRequest, UpdateTaskRequest, User
from ..db import db
from .auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[Task])
def get_tasks(user: User = Depends(get_current_user)):
    return db.get_tasks(user.id)

@router.post("", response_model=Task, status_code=201)
def create_task(request: CreateTaskRequest, user: User = Depends(get_current_user)):
    return db.create_task(request, user.id)

@router.delete("/{id}")
def delete_task(id: UUID, user: User = Depends(get_current_user)):
    task = db.get_task(id)
    if not task or task.userId != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if not db.delete_task(id):
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

@router.put("/{id}", response_model=Task)
def update_task(id: UUID, request: UpdateTaskRequest, user: User = Depends(get_current_user)):
    task = db.get_task(id)
    if not task or task.userId != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if request.title is not None:
        task.title = request.title
    if request.estimatedMinutes is not None:
        task.estimatedMinutes = request.estimatedMinutes
    if request.energy is not None:
        task.energy = request.energy
    if request.goalId is not None: # Can be None in request, indicating no change if value is passed? Or nullable?
        # UpdateTaskRequest defines goalId as Optional[UUID]. If set, we update. 
        # But if we want to UNSET it (set to None), we need to distinguish between "not provided" and "provided as null".
        # Pydantic's Optional usually implies None if missing.
        # Let's assume for now we only support setting to a new ID or keeping same.
        # If we want to clear it, client might send null? Pydantic V2 distinguishes.
        # For simplicity, if passed, update.
        task.goalId = request.goalId

    return db.update_task(id, task)

@router.put("/{id}/complete", response_model=Task)
def complete_task(id: UUID, request: CompleteTaskRequest = None, user: User = Depends(get_current_user)):
    task = db.get_task(id)
    if not task or task.userId != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # If already completed, we might need to handle adjusting minutes, but for now assume simple complete
    # or if re-completing, maybe we should subtract old minutes first? 
    # Let's keep it simple: if already completed, do nothing or update?
    # The requirement imply simple flow. Let's assume valid state transitions.
    
    task.completed = True
    minutes_added = 0
    if request and request.actualMinutes is not None:
        minutes_added = request.actualMinutes
    else:
        minutes_added = task.estimatedMinutes
    
    task.completedMinutes = minutes_added
    
    # Update goal progress
    if task.goalId:
        print(f"DEBUG: Task has goalId: {task.goalId} type: {type(task.goalId)}")
        goal = db.get_goal(task.goalId)
        # Ensure goal also belongs to user (should, but good to check)
        if goal and goal.userId == user.id:
            print(f"DEBUG: Found goal: {goal}")
            print(f"DEBUG: Updating goal {goal.id} adding {minutes_added} minutes")
            goal.completedMinutes += minutes_added
            db.update_goal(goal.id, goal)
            print(f"DEBUG: Goal after update: {goal}")
        else:
            print(f"DEBUG: Goal not found or not owned by user.")

    return db.update_task(id, task)

@router.put("/{id}/reset", response_model=Task)
def reset_task(id: UUID, user: User = Depends(get_current_user)):
    task = db.get_task(id)
    if not task or task.userId != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.completed:
        # Update goal progress (revert)
        if task.goalId:
            goal = db.get_goal(task.goalId)
            if goal and goal.userId == user.id:
                # Ensure we don't go below 0 (though shouldn't happen if logic is correct)
                goal.completedMinutes = max(0, goal.completedMinutes - task.completedMinutes)
                db.update_goal(goal.id, goal)

    task.completed = False
    task.completedMinutes = 0
    return db.update_task(id, task)
