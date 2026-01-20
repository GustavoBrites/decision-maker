import { describe, it, expect, beforeEach } from 'vitest';
import { 
  authApi, 
  tasksApi, 
  goalApi, 
  budgetApi, 
  decisionApi, 
  resetMockData,
} from '@/lib/api';

describe('Authentication API', () => {
  beforeEach(() => {
    resetMockData();
  });

  describe('login', () => {
    it('should successfully log in with valid credentials', async () => {
      const result = await authApi.login('test@example.com', 'password123');
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.username).toBe('test');
      expect(result.token).toBeDefined();
    });

    it('should throw error for empty email', async () => {
      await expect(authApi.login('', 'password')).rejects.toThrow('Email and password are required');
    });

    it('should throw error for short password', async () => {
      await expect(authApi.login('test@example.com', 'ab')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signup', () => {
    it('should successfully create an account', async () => {
      const result = await authApi.signup('new@example.com', 'password123', 'newuser');
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.username).toBe('newuser');
      expect(result.token).toBeDefined();
    });

    it('should throw error for missing fields', async () => {
      await expect(authApi.signup('', 'password', 'user')).rejects.toThrow('All fields are required');
    });

    it('should throw error for password shorter than 6 characters', async () => {
      await expect(authApi.signup('test@example.com', 'short', 'user')).rejects.toThrow('Password must be at least 6 characters');
    });
  });

  describe('logout', () => {
    it('should successfully log out', async () => {
      await authApi.login('test@example.com', 'password123');
      await authApi.logout();
      
      const currentUser = await authApi.getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when not logged in', async () => {
      const user = await authApi.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return user when logged in', async () => {
      await authApi.login('test@example.com', 'password123');
      const user = await authApi.getCurrentUser();
      
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });
  });
});

describe('Tasks API', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('should fetch initial tasks', async () => {
    const tasks = await tasksApi.getTasks();
    
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0]).toHaveProperty('id');
    expect(tasks[0]).toHaveProperty('title');
    expect(tasks[0]).toHaveProperty('estimatedMinutes');
    expect(tasks[0]).toHaveProperty('category');
  });

  it('should add a new task', async () => {
    const initialTasks = await tasksApi.getTasks();
    const newTask = await tasksApi.addTask({
      title: 'New Test Task',
      estimatedMinutes: 25,
      category: 'neutral',
    });

    expect(newTask.id).toBeDefined();
    expect(newTask.title).toBe('New Test Task');
    expect(newTask.completed).toBe(false);

    const updatedTasks = await tasksApi.getTasks();
    expect(updatedTasks.length).toBe(initialTasks.length + 1);
  });

  it('should complete a task', async () => {
    const tasks = await tasksApi.getTasks();
    const taskToComplete = tasks[0];
    
    const completedTask = await tasksApi.completeTask(taskToComplete.id);
    
    expect(completedTask.completed).toBe(true);
    expect(completedTask.completedMinutes).toBe(taskToComplete.estimatedMinutes);
  });

  it('should delete a task', async () => {
    const initialTasks = await tasksApi.getTasks();
    const taskToDelete = initialTasks[0];
    
    await tasksApi.deleteTask(taskToDelete.id);
    
    const updatedTasks = await tasksApi.getTasks();
    expect(updatedTasks.length).toBe(initialTasks.length - 1);
    expect(updatedTasks.find(t => t.id === taskToDelete.id)).toBeUndefined();
  });
});

describe('Goal and Budget APIs', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('should fetch weekly goal', async () => {
    const goal = await goalApi.getWeeklyGoal();
    
    expect(goal.id).toBeDefined();
    expect(goal.title).toBeDefined();
    expect(goal.targetMinutes).toBeGreaterThan(0);
    expect(goal.completedMinutes).toBeDefined();
  });

  it('should fetch weekly budget', async () => {
    const budget = await budgetApi.getWeeklyBudget();
    
    expect(budget.id).toBeDefined();
    expect(budget.category).toBeDefined();
    expect(budget.limit).toBeGreaterThan(0);
    expect(budget.spent).toBeDefined();
  });

  it('should update goal progress when completing goal task', async () => {
    const initialGoal = await goalApi.getWeeklyGoal();
    const tasks = await tasksApi.getTasks();
    const goalTask = tasks.find(t => t.category === 'goal' && !t.completed);
    
    if (goalTask) {
      await tasksApi.completeTask(goalTask.id);
      const updatedGoal = await goalApi.getWeeklyGoal();
      
      expect(updatedGoal.completedMinutes).toBe(
        initialGoal.completedMinutes + goalTask.estimatedMinutes
      );
    }
  });

  it('should update budget when completing task with cost', async () => {
    const initialBudget = await budgetApi.getWeeklyBudget();
    const tasks = await tasksApi.getTasks();
    const paidTask = tasks.find(t => t.cost && t.cost > 0 && !t.completed);
    
    if (paidTask) {
      await tasksApi.completeTask(paidTask.id);
      const updatedBudget = await budgetApi.getWeeklyBudget();
      
      expect(updatedBudget.spent).toBe(initialBudget.spent + paidTask.cost!);
    }
  });
});

describe('Decision API', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('should return a recommendation for available time', async () => {
    const recommendation = await decisionApi.getRecommendation(60);
    
    expect(recommendation).not.toBeNull();
    expect(recommendation?.task).toBeDefined();
    expect(recommendation?.reason).toBeDefined();
    expect(recommendation?.task.estimatedMinutes).toBeLessThanOrEqual(60);
  });

  it('should prefer goal tasks over neutral tasks', async () => {
    const recommendation = await decisionApi.getRecommendation(120);
    
    // With enough time, should recommend a goal task first
    expect(recommendation?.task.category).toBe('goal');
  });

  it('should respect budget constraints', async () => {
    const budget = await budgetApi.getWeeklyBudget();
    const remainingBudget = budget.limit - budget.spent;
    
    const recommendation = await decisionApi.getRecommendation(300);
    
    if (recommendation?.task.cost) {
      expect(recommendation.task.cost).toBeLessThanOrEqual(remainingBudget);
    }
  });

  it('should return null when no tasks fit constraints', async () => {
    // Very short time that no task fits
    const recommendation = await decisionApi.getRecommendation(1);
    
    expect(recommendation).toBeNull();
  });

  it('should provide an alternative when available', async () => {
    const recommendation = await decisionApi.getRecommendation(120);
    
    // With multiple tasks available, should have an alternative
    expect(recommendation?.alternative).toBeDefined();
    expect(recommendation?.alternativeReason).toBeDefined();
  });

  it('should respect time constraints', async () => {
    const recommendation = await decisionApi.getRecommendation(15);
    
    if (recommendation) {
      expect(recommendation.task.estimatedMinutes).toBeLessThanOrEqual(15);
    }
  });
});
