from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..models import Task, CreateTaskRequest, CompleteTaskRequest, UpdateTaskRequest, User
from ..database import get_db
from ..db_models import TaskDB, WeeklyGoalDB
from .auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])


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


@router.get("", response_model=List[Task])
def get_tasks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(TaskDB).filter(TaskDB.user_id == str(user.id)).all()
    return [task_db_to_pydantic(t) for t in tasks]


@router.post("", response_model=Task, status_code=201)
def create_task(request: CreateTaskRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task_db = TaskDB(
        user_id=str(user.id),
        title=request.title,
        estimated_minutes=request.estimatedMinutes,
        energy=request.energy.value,
        goal_id=str(request.goalId) if request.goalId else None,
        completed=False,
        completed_minutes=0
    )
    db.add(task_db)
    db.commit()
    db.refresh(task_db)
    return task_db_to_pydantic(task_db)


@router.delete("/{id}")
def delete_task(id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task_db = db.query(TaskDB).filter(TaskDB.id == str(id)).first()
    if not task_db or task_db.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task_db)
    db.commit()
    return {"message": "Task deleted"}


@router.put("/{id}", response_model=Task)
def update_task(id: UUID, request: UpdateTaskRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task_db = db.query(TaskDB).filter(TaskDB.id == str(id)).first()
    if not task_db or task_db.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Task not found")
    
    if request.title is not None:
        task_db.title = request.title
    if request.estimatedMinutes is not None:
        task_db.estimated_minutes = request.estimatedMinutes
    if request.energy is not None:
        task_db.energy = request.energy.value
    if request.goalId is not None:
        task_db.goal_id = str(request.goalId)
    
    db.commit()
    db.refresh(task_db)
    return task_db_to_pydantic(task_db)


@router.put("/{id}/complete", response_model=Task)
def complete_task(id: UUID, request: CompleteTaskRequest = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task_db = db.query(TaskDB).filter(TaskDB.id == str(id)).first()
    if not task_db or task_db.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_db.completed = True
    
    if request and request.actualMinutes is not None:
        minutes_added = request.actualMinutes
    else:
        minutes_added = task_db.estimated_minutes
    
    task_db.completed_minutes = minutes_added
    
    # Update goal progress if task has a goal
    if task_db.goal_id:
        goal_db = db.query(WeeklyGoalDB).filter(
            WeeklyGoalDB.id == task_db.goal_id,
            WeeklyGoalDB.user_id == str(user.id)
        ).first()
        if goal_db:
            goal_db.completed_minutes += minutes_added
    
    db.commit()
    db.refresh(task_db)
    return task_db_to_pydantic(task_db)


@router.put("/{id}/reset", response_model=Task)
def reset_task(id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task_db = db.query(TaskDB).filter(TaskDB.id == str(id)).first()
    if not task_db or task_db.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_db.completed and task_db.goal_id:
        # Revert goal progress
        goal_db = db.query(WeeklyGoalDB).filter(
            WeeklyGoalDB.id == task_db.goal_id,
            WeeklyGoalDB.user_id == str(user.id)
        ).first()
        if goal_db:
            goal_db.completed_minutes = max(0, goal_db.completed_minutes - task_db.completed_minutes)
    
    task_db.completed = False
    task_db.completed_minutes = 0
    
    db.commit()
    db.refresh(task_db)
    return task_db_to_pydantic(task_db)
