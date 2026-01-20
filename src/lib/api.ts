// Centralized mock API layer for Now What? app
// All "backend" operations are simulated here

export interface User {
  id: string;
  username: string;
  email: string;
}

export type EnergyLevel = 'low' | 'medium' | 'high';

export type GoalType = 'body' | 'mind' | 'soul' | 'custom';

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  cost?: number;
  goalId: string | null; // Link to a specific goal, or null for neutral tasks
  energy: EnergyLevel;
  completed: boolean;
  completedMinutes?: number;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  type: GoalType;
  targetMinutes: number;
  completedMinutes: number;
}

export interface Recommendation {
  task: Task;
  reason: string;
  alternative?: Task;
  alternativeReason?: string;
}

// Simulated delay for async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage (simulates database)
let currentUser: User | null = null;

let weeklyGoals: WeeklyGoal[] = [
  {
    id: 'goal-body',
    title: 'Exercise 150 minutes',
    type: 'body',
    targetMinutes: 150,
    completedMinutes: 45,
  },
  {
    id: 'goal-mind',
    title: 'Read 60 minutes',
    type: 'mind',
    targetMinutes: 60,
    completedMinutes: 20,
  },
  {
    id: 'goal-soul',
    title: 'Meditation 30 minutes',
    type: 'soul',
    targetMinutes: 30,
    completedMinutes: 0,
  },
];

let tasks: Task[] = [
  { id: '1', title: 'Morning jog', estimatedMinutes: 30, goalId: 'goal-body', energy: 'high', completed: false },
  { id: '2', title: 'Read a book chapter', estimatedMinutes: 20, goalId: 'goal-mind', energy: 'low', completed: false },
  { id: '3', title: 'Yoga session', estimatedMinutes: 45, goalId: 'goal-body', energy: 'medium', completed: false },
  { id: '4', title: 'Coffee with friend', estimatedMinutes: 60, cost: 15, goalId: null, energy: 'low', completed: false },
  { id: '5', title: 'Gym workout', estimatedMinutes: 60, cost: 0, goalId: 'goal-body', energy: 'high', completed: false },
  { id: '6', title: 'Watch a documentary', estimatedMinutes: 90, goalId: 'goal-mind', energy: 'low', completed: false },
  { id: '7', title: 'Quick stretch', estimatedMinutes: 10, goalId: 'goal-body', energy: 'low', completed: false },
  { id: '8', title: 'Meditation', estimatedMinutes: 15, goalId: 'goal-soul', energy: 'low', completed: false },
  { id: '9', title: 'Journaling', estimatedMinutes: 20, goalId: 'goal-soul', energy: 'low', completed: false },
  { id: '10', title: 'Listen to podcast', estimatedMinutes: 30, goalId: 'goal-mind', energy: 'low', completed: false },
];

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(500);
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Simulate validation
    if (password.length < 4) {
      throw new Error('Invalid credentials');
    }
    
    const user: User = {
      id: crypto.randomUUID(),
      username: email.split('@')[0],
      email,
    };
    
    currentUser = user;
    return { user, token: 'mock-jwt-token-' + user.id };
  },

  async signup(email: string, password: string, username: string): Promise<{ user: User; token: string }> {
    await delay(600);
    
    if (!email || !password || !username) {
      throw new Error('All fields are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    const user: User = {
      id: crypto.randomUUID(),
      username,
      email,
    };
    
    currentUser = user;
    return { user, token: 'mock-jwt-token-' + user.id };
  },

  async logout(): Promise<void> {
    await delay(200);
    currentUser = null;
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(100);
    return currentUser;
  },
};

// Tasks API
export const tasksApi = {
  async getTasks(): Promise<Task[]> {
    await delay(300);
    return [...tasks];
  },

  async addTask(task: Omit<Task, 'id' | 'completed' | 'completedMinutes'>): Promise<Task> {
    await delay(300);
    
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
    };
    
    tasks.push(newTask);
    return newTask;
  },

  async completeTask(taskId: string, actualMinutes?: number): Promise<Task> {
    await delay(200);
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    const task = tasks[taskIndex];
    const minutes = actualMinutes ?? task.estimatedMinutes;
    
    tasks[taskIndex] = {
      ...task,
      completed: true,
      completedMinutes: minutes,
    };
    
    // Update goal progress if it's a goal-related task
    if (task.goalId) {
      const goalIndex = weeklyGoals.findIndex(g => g.id === task.goalId);
      if (goalIndex !== -1) {
        weeklyGoals[goalIndex].completedMinutes += minutes;
      }
    }
    
    return tasks[taskIndex];
  },

  async deleteTask(taskId: string): Promise<void> {
    await delay(200);
    tasks = tasks.filter(t => t.id !== taskId);
  },

  async resetTask(taskId: string): Promise<Task> {
    await delay(200);
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    const task = tasks[taskIndex];
    
    // Reverse the completion effects
    if (task.completed) {
      if (task.goalId && task.completedMinutes) {
        const goalIndex = weeklyGoals.findIndex(g => g.id === task.goalId);
        if (goalIndex !== -1) {
          weeklyGoals[goalIndex].completedMinutes -= task.completedMinutes;
        }
      }
    }
    
    tasks[taskIndex] = {
      ...task,
      completed: false,
      completedMinutes: undefined,
    };
    
    return tasks[taskIndex];
  },
};

// Goals API
export const goalApi = {
  async getWeeklyGoals(): Promise<WeeklyGoal[]> {
    await delay(200);
    return [...weeklyGoals];
  },

  async getWeeklyGoal(): Promise<WeeklyGoal> {
    // Backward compatibility - return first goal
    await delay(200);
    return { ...weeklyGoals[0] };
  },

  async addGoal(goal: Omit<WeeklyGoal, 'id' | 'completedMinutes'>): Promise<WeeklyGoal> {
    await delay(300);
    
    if (weeklyGoals.length >= 5) {
      throw new Error('Maximum of 5 goals allowed');
    }
    
    const newGoal: WeeklyGoal = {
      ...goal,
      id: crypto.randomUUID(),
      completedMinutes: 0,
    };
    
    weeklyGoals.push(newGoal);
    return newGoal;
  },

  async updateGoal(goalId: string, updates: Partial<Omit<WeeklyGoal, 'id'>>): Promise<WeeklyGoal> {
    await delay(300);
    
    const goalIndex = weeklyGoals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) {
      throw new Error('Goal not found');
    }
    
    weeklyGoals[goalIndex] = { ...weeklyGoals[goalIndex], ...updates };
    return { ...weeklyGoals[goalIndex] };
  },

  async deleteGoal(goalId: string): Promise<void> {
    await delay(200);
    
    if (weeklyGoals.length <= 3) {
      throw new Error('Minimum of 3 goals required');
    }
    
    // Remove the goal
    weeklyGoals = weeklyGoals.filter(g => g.id !== goalId);
    
    // Clear goalId from tasks that had this goal
    tasks = tasks.map(t => t.goalId === goalId ? { ...t, goalId: null } : t);
  },

  async updateWeeklyGoal(updates: Partial<WeeklyGoal>): Promise<WeeklyGoal> {
    // Backward compatibility
    await delay(300);
    weeklyGoals[0] = { ...weeklyGoals[0], ...updates };
    return { ...weeklyGoals[0] };
  },
};

// Decision/Recommendation API
export const decisionApi = {
  async getRecommendation(availableMinutes: number, energyLevel: EnergyLevel): Promise<Recommendation | null> {
    await delay(400);
    
    const incompleteTasks = tasks.filter(t => !t.completed);
    
    // Energy level hierarchy: low tasks can be done at any energy, medium at medium+, high only at high
    const energyMatches = (taskEnergy: EnergyLevel, userEnergy: EnergyLevel): boolean => {
      const energyOrder: EnergyLevel[] = ['low', 'medium', 'high'];
      const taskLevel = energyOrder.indexOf(taskEnergy);
      const userLevel = energyOrder.indexOf(userEnergy);
      return taskLevel <= userLevel;
    };
    
    // Filter tasks that fit time and energy constraints
    const eligibleTasks = incompleteTasks.filter(task => {
      const fitsTime = task.estimatedMinutes <= availableMinutes;
      const fitsEnergy = energyMatches(task.energy, energyLevel);
      return fitsTime && fitsEnergy;
    });
    
    if (eligibleTasks.length === 0) {
      return null;
    }
    
    // Sort by priority: goal tasks first (prioritize goals with more remaining), then by how well they fit the time
    const sortedTasks = [...eligibleTasks].sort((a, b) => {
      // Goal tasks get priority over neutral tasks
      const aHasGoal = a.goalId !== null;
      const bHasGoal = b.goalId !== null;
      
      if (aHasGoal && !bHasGoal) return -1;
      if (bHasGoal && !aHasGoal) return 1;
      
      // If both have goals, prioritize goals with more remaining time
      if (aHasGoal && bHasGoal) {
        const goalA = weeklyGoals.find(g => g.id === a.goalId);
        const goalB = weeklyGoals.find(g => g.id === b.goalId);
        
        if (goalA && goalB) {
          const remainingA = goalA.targetMinutes - goalA.completedMinutes;
          const remainingB = goalB.targetMinutes - goalB.completedMinutes;
          if (remainingA !== remainingB) return remainingB - remainingA; // Higher remaining first
        }
      }
      
      // Prefer tasks that better utilize available time
      const aUtilization = a.estimatedMinutes / availableMinutes;
      const bUtilization = b.estimatedMinutes / availableMinutes;
      return bUtilization - aUtilization;
    });
    
    const recommendedTask = sortedTasks[0];
    const alternativeTask = sortedTasks.length > 1 ? sortedTasks[1] : undefined;
    
    // Generate reason
    const generateReason = (task: Task, isAlternative = false): string => {
      const reasons: string[] = [];
      
      if (task.goalId) {
        const goal = weeklyGoals.find(g => g.id === task.goalId);
        if (goal) {
          const remaining = goal.targetMinutes - goal.completedMinutes;
          reasons.push(`contributes ${task.estimatedMinutes} min toward your "${goal.title}" goal (${remaining} min remaining)`);
        }
      }
      
      reasons.push(`matches your ${task.energy} energy level`);
      
      const timeUtilization = Math.round((task.estimatedMinutes / availableMinutes) * 100);
      reasons.push(`uses ${timeUtilization}% of your available time`);
      
      if (isAlternative) {
        return `Alternative: ${reasons.join(', ')}.`;
      }
      
      return `This task ${reasons.join(', ')}.`;
    };
    
    return {
      task: recommendedTask,
      reason: generateReason(recommendedTask),
      alternative: alternativeTask,
      alternativeReason: alternativeTask ? generateReason(alternativeTask, true) : undefined,
    };
  },
};

// Export a function to reset all data (useful for testing)
export const resetMockData = () => {
  currentUser = null;
  
  weeklyGoals = [
    {
      id: 'goal-body',
      title: 'Exercise 150 minutes',
      type: 'body',
      targetMinutes: 150,
      completedMinutes: 45,
    },
    {
      id: 'goal-mind',
      title: 'Read 60 minutes',
      type: 'mind',
      targetMinutes: 60,
      completedMinutes: 20,
    },
    {
      id: 'goal-soul',
      title: 'Meditation 30 minutes',
      type: 'soul',
      targetMinutes: 30,
      completedMinutes: 0,
    },
  ];
  
  tasks = [
    { id: '1', title: 'Morning jog', estimatedMinutes: 30, goalId: 'goal-body', energy: 'high', completed: false },
    { id: '2', title: 'Read a book chapter', estimatedMinutes: 20, goalId: 'goal-mind', energy: 'low', completed: false },
    { id: '3', title: 'Yoga session', estimatedMinutes: 45, goalId: 'goal-body', energy: 'medium', completed: false },
    { id: '4', title: 'Coffee with friend', estimatedMinutes: 60, cost: 15, goalId: null, energy: 'low', completed: false },
    { id: '5', title: 'Gym workout', estimatedMinutes: 60, cost: 0, goalId: 'goal-body', energy: 'high', completed: false },
    { id: '6', title: 'Watch a documentary', estimatedMinutes: 90, goalId: 'goal-mind', energy: 'low', completed: false },
    { id: '7', title: 'Quick stretch', estimatedMinutes: 10, goalId: 'goal-body', energy: 'low', completed: false },
    { id: '8', title: 'Meditation', estimatedMinutes: 15, goalId: 'goal-soul', energy: 'low', completed: false },
    { id: '9', title: 'Journaling', estimatedMinutes: 20, goalId: 'goal-soul', energy: 'low', completed: false },
    { id: '10', title: 'Listen to podcast', estimatedMinutes: 30, goalId: 'goal-mind', energy: 'low', completed: false },
  ];
};
