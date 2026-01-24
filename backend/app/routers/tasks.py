from fastapi import APIRouter, HTTPException
from typing import List
from uuid import UUID
from ..models import Task, CreateTaskRequest, CompleteTaskRequest
from ..db import db

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[Task])
def get_tasks():
    return db.get_tasks()

@router.post("", response_model=Task, status_code=201)
def create_task(request: CreateTaskRequest):
    return db.create_task(request)

@router.delete("/{id}")
def delete_task(id: UUID):
    if not db.delete_task(id):
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

@router.put("/{id}/complete", response_model=Task)
def complete_task(id: UUID, request: CompleteTaskRequest = None):
    task = db.get_task(id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.completed = True
    if request and request.actualMinutes is not None:
        task.completedMinutes = request.actualMinutes
    else:
        task.completedMinutes = task.estimatedMinutes # Default to estimated if not provided
        
    return db.update_task(id, task)

@router.put("/{id}/reset", response_model=Task)
def reset_task(id: UUID):
    task = db.get_task(id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.completed = False
    task.completedMinutes = 0
    return db.update_task(id, task)
