import { describe, it, expect, beforeEach } from 'vitest';
import { 
  authApi, 
  tasksApi, 
  goalApi, 
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
    expect(tasks[0]).toHaveProperty('goalId');
    expect(tasks[0]).toHaveProperty('energy');
  });

  it('should add a new task', async () => {
    const initialTasks = await tasksApi.getTasks();
    const newTask = await tasksApi.addTask({
      title: 'New Test Task',
      estimatedMinutes: 25,
      goalId: null,
      energy: 'medium',
    });

    expect(newTask.id).toBeDefined();
    expect(newTask.title).toBe('New Test Task');
    expect(newTask.completed).toBe(false);
    expect(newTask.energy).toBe('medium');

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

describe('Goals API', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('should fetch weekly goals', async () => {
    const goals = await goalApi.getWeeklyGoals();
    
    expect(goals.length).toBe(3);
    expect(goals[0]).toHaveProperty('id');
    expect(goals[0]).toHaveProperty('title');
    expect(goals[0]).toHaveProperty('type');
    expect(goals[0]).toHaveProperty('targetMinutes');
    expect(goals[0]).toHaveProperty('completedMinutes');
  });

  it('should have body, mind, and soul goals by default', async () => {
    const goals = await goalApi.getWeeklyGoals();
    
    const types = goals.map(g => g.type);
    expect(types).toContain('body');
    expect(types).toContain('mind');
    expect(types).toContain('soul');
  });

  it('should update a goal', async () => {
    const goals = await goalApi.getWeeklyGoals();
    const goalToUpdate = goals[0];
    
    const updatedGoal = await goalApi.updateGoal(goalToUpdate.id, {
      title: 'Updated Goal',
      targetMinutes: 200,
    });
    
    expect(updatedGoal.title).toBe('Updated Goal');
    expect(updatedGoal.targetMinutes).toBe(200);
  });

  it('should add a new goal', async () => {
    const newGoal = await goalApi.addGoal({
      title: 'New Custom Goal',
      targetMinutes: 100,
      type: 'custom',
    });
    
    expect(newGoal.id).toBeDefined();
    expect(newGoal.title).toBe('New Custom Goal');
    expect(newGoal.completedMinutes).toBe(0);
    
    const goals = await goalApi.getWeeklyGoals();
    expect(goals.length).toBe(4);
  });

  it('should not allow more than 5 goals', async () => {
    await goalApi.addGoal({ title: 'Goal 4', targetMinutes: 60, type: 'custom' });
    await goalApi.addGoal({ title: 'Goal 5', targetMinutes: 60, type: 'custom' });
    
    await expect(
      goalApi.addGoal({ title: 'Goal 6', targetMinutes: 60, type: 'custom' })
    ).rejects.toThrow('Maximum of 5 goals allowed');
  });

  it('should not allow fewer than 3 goals', async () => {
    const goals = await goalApi.getWeeklyGoals();
    
    await expect(goalApi.deleteGoal(goals[0].id)).rejects.toThrow('Minimum of 3 goals required');
  });

  it('should update goal progress when completing goal task', async () => {
    const initialGoals = await goalApi.getWeeklyGoals();
    const bodyGoal = initialGoals.find(g => g.type === 'body')!;
    const initialCompleted = bodyGoal.completedMinutes;
    
    const tasks = await tasksApi.getTasks();
    const bodyTask = tasks.find(t => t.goalId === bodyGoal.id && !t.completed);
    
    if (bodyTask) {
      await tasksApi.completeTask(bodyTask.id);
      const updatedGoals = await goalApi.getWeeklyGoals();
      const updatedBodyGoal = updatedGoals.find(g => g.id === bodyGoal.id)!;
      
      expect(updatedBodyGoal.completedMinutes).toBe(
        initialCompleted + bodyTask.estimatedMinutes
      );
    }
  });
});

describe('Decision API', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('should return a recommendation for available time and energy', async () => {
    const recommendation = await decisionApi.getRecommendation(60, 'high');
    
    expect(recommendation).not.toBeNull();
    expect(recommendation?.task).toBeDefined();
    expect(recommendation?.reason).toBeDefined();
    expect(recommendation?.task.estimatedMinutes).toBeLessThanOrEqual(60);
  });

  it('should prefer goal tasks over neutral tasks', async () => {
    const recommendation = await decisionApi.getRecommendation(120, 'high');
    
    // With enough time and energy, should recommend a goal task first
    expect(recommendation?.task.goalId).not.toBeNull();
  });

  it('should respect energy constraints - low energy', async () => {
    const recommendation = await decisionApi.getRecommendation(300, 'low');
    
    if (recommendation) {
      // Low energy users should only get low energy tasks
      expect(recommendation.task.energy).toBe('low');
    }
  });

  it('should respect energy constraints - medium energy', async () => {
    const recommendation = await decisionApi.getRecommendation(300, 'medium');
    
    if (recommendation) {
      // Medium energy users should get low or medium energy tasks
      expect(['low', 'medium']).toContain(recommendation.task.energy);
    }
  });

  it('should return null when no tasks fit constraints', async () => {
    // Very short time that no task fits
    const recommendation = await decisionApi.getRecommendation(1, 'high');
    
    expect(recommendation).toBeNull();
  });

  it('should provide an alternative when available', async () => {
    const recommendation = await decisionApi.getRecommendation(120, 'high');
    
    // With multiple tasks available, should have an alternative
    expect(recommendation?.alternative).toBeDefined();
    expect(recommendation?.alternativeReason).toBeDefined();
  });

  it('should respect time constraints', async () => {
    const recommendation = await decisionApi.getRecommendation(15, 'high');
    
    if (recommendation) {
      expect(recommendation.task.estimatedMinutes).toBeLessThanOrEqual(15);
    }
  });
});
