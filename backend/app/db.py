from typing import List, Optional, Dict
from uuid import UUID, uuid4
from .models import User, Task, WeeklyGoal, CreateUserRequest, CreateTaskRequest, CreateGoalRequest

class MockDB:
    def __init__(self):
        self.users: Dict[str, User] = {}  # email -> User
        self.users_by_id: Dict[UUID, User] = {}
        self.passwords: Dict[str, str] = {} # email -> password (hashed ideally, but plain for mock)
        self.tasks: Dict[UUID, Task] = {}
        self.goals: Dict[UUID, WeeklyGoal] = {}
        self._seed_data()

    def _seed_data(self):
        # Seed User
        self.create_user(CreateUserRequest(
            username="demo_user",
            email="demo@example.com",
            password="password123"
        ))
        
        # Seed Tasks
        self.create_task(CreateTaskRequest(
            title="Complete Project Proposal",
            estimatedMinutes=120,
            energy="high",
            cost=0,
            completed=False
        ))
        self.create_task(CreateTaskRequest(
            title="Read 10 pages of a book",
            estimatedMinutes=30,
            energy="low",
            cost=0,
            completed=False
        ))
        self.create_task(CreateTaskRequest(
            title="Go for a run",
            estimatedMinutes=45,
            energy="high",
            cost=0,
            completed=False
        ))
        self.create_task(CreateTaskRequest(
            title="Organize desk",
            estimatedMinutes=15,
            energy="low",
            cost=0,
            completed=False
        ))

        # Seed Goals
        self.create_goal(CreateGoalRequest(
            title="Read 1 Book a Month",
            type="mind",
            targetMinutes=300
        ))
        self.create_goal(CreateGoalRequest(
            title="Exercise 3 times a week",
            type="body",
            targetMinutes=180
        ))

    def create_user(self, user_req: CreateUserRequest) -> User:
        if user_req.email in self.users:
            raise ValueError("User already exists")
        
        user_id = uuid4()
        user = User(id=user_id, username=user_req.username, email=user_req.email)
        self.users[user_req.email] = user
        self.users_by_id[user_id] = user
        self.passwords[user_req.email] = user_req.password
        return user

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.users.get(email)

    def verify_password(self, email: str, password: str) -> bool:
        return self.passwords.get(email) == password

    def create_task(self, task_req: CreateTaskRequest) -> Task:
        task_id = uuid4()
        task = Task(
            id=task_id,
            **task_req.model_dump()
        )
        self.tasks[task_id] = task
        return task

    def get_tasks(self) -> List[Task]:
        return list(self.tasks.values())

    def get_task(self, task_id: UUID) -> Optional[Task]:
        return self.tasks.get(task_id)

    def delete_task(self, task_id: UUID) -> bool:
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False

    def update_task(self, task_id: UUID, task: Task) -> Task:
        self.tasks[task_id] = task
        return task

    def create_goal(self, goal_req: CreateGoalRequest) -> WeeklyGoal:
        goal_id = uuid4()
        goal = WeeklyGoal(
            id=goal_id,
            completedMinutes=0,
            **goal_req.model_dump()
        )
        self.goals[goal_id] = goal
        return goal

    def get_goals(self) -> List[WeeklyGoal]:
        return list(self.goals.values())

    def get_goal(self, goal_id: UUID) -> Optional[WeeklyGoal]:
        return self.goals.get(goal_id)

    def delete_goal(self, goal_id: UUID) -> bool:
        if goal_id in self.goals:
            del self.goals[goal_id]
            return True
        return False

    def update_goal(self, goal_id: UUID, goal: WeeklyGoal) -> WeeklyGoal:
        self.goals[goal_id] = goal
        return goal

db = MockDB()
