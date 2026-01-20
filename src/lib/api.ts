// Centralized mock API layer for Now What? app
// All "backend" operations are simulated here

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  cost?: number;
  category: 'goal' | 'neutral';
  completed: boolean;
  completedMinutes?: number;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  targetMinutes: number;
  completedMinutes: number;
}

export interface WeeklyBudget {
  id: string;
  category: string;
  limit: number;
  spent: number;
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
let tasks: Task[] = [
  { id: '1', title: 'Morning jog', estimatedMinutes: 30, category: 'goal', completed: false },
  { id: '2', title: 'Read a book chapter', estimatedMinutes: 20, category: 'neutral', completed: false },
  { id: '3', title: 'Yoga session', estimatedMinutes: 45, category: 'goal', completed: false },
  { id: '4', title: 'Coffee with friend', estimatedMinutes: 60, cost: 15, category: 'neutral', completed: false },
  { id: '5', title: 'Gym workout', estimatedMinutes: 60, cost: 0, category: 'goal', completed: false },
  { id: '6', title: 'Watch a movie', estimatedMinutes: 120, cost: 12, category: 'neutral', completed: false },
  { id: '7', title: 'Quick stretch', estimatedMinutes: 10, category: 'goal', completed: false },
  { id: '8', title: 'Meditation', estimatedMinutes: 15, category: 'goal', completed: false },
];

let weeklyGoal: WeeklyGoal = {
  id: '1',
  title: 'Exercise 150 minutes',
  targetMinutes: 150,
  completedMinutes: 45,
};

let weeklyBudget: WeeklyBudget = {
  id: '1',
  category: 'Entertainment & Wellness',
  limit: 100,
  spent: 27,
};

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
    if (task.category === 'goal') {
      weeklyGoal.completedMinutes += minutes;
    }
    
    // Update budget if task has a cost
    if (task.cost) {
      weeklyBudget.spent += task.cost;
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
      if (task.category === 'goal' && task.completedMinutes) {
        weeklyGoal.completedMinutes -= task.completedMinutes;
      }
      if (task.cost) {
        weeklyBudget.spent -= task.cost;
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

// Goal API
export const goalApi = {
  async getWeeklyGoal(): Promise<WeeklyGoal> {
    await delay(200);
    return { ...weeklyGoal };
  },

  async updateWeeklyGoal(updates: Partial<WeeklyGoal>): Promise<WeeklyGoal> {
    await delay(300);
    weeklyGoal = { ...weeklyGoal, ...updates };
    return { ...weeklyGoal };
  },
};

// Budget API
export const budgetApi = {
  async getWeeklyBudget(): Promise<WeeklyBudget> {
    await delay(200);
    return { ...weeklyBudget };
  },

  async updateWeeklyBudget(updates: Partial<WeeklyBudget>): Promise<WeeklyBudget> {
    await delay(300);
    weeklyBudget = { ...weeklyBudget, ...updates };
    return { ...weeklyBudget };
  },
};

// Decision/Recommendation API
export const decisionApi = {
  async getRecommendation(availableMinutes: number): Promise<Recommendation | null> {
    await delay(400);
    
    const remainingBudget = weeklyBudget.limit - weeklyBudget.spent;
    const incompleteTasks = tasks.filter(t => !t.completed);
    
    // Filter tasks that fit time and budget constraints
    const eligibleTasks = incompleteTasks.filter(task => {
      const fitsTime = task.estimatedMinutes <= availableMinutes;
      const fitsBudget = !task.cost || task.cost <= remainingBudget;
      return fitsTime && fitsBudget;
    });
    
    if (eligibleTasks.length === 0) {
      return null;
    }
    
    // Sort by priority: goal tasks first, then by how well they fit the time
    const sortedTasks = [...eligibleTasks].sort((a, b) => {
      // Goal tasks get priority
      if (a.category === 'goal' && b.category !== 'goal') return -1;
      if (b.category === 'goal' && a.category !== 'goal') return 1;
      
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
      
      if (task.category === 'goal') {
        const remaining = weeklyGoal.targetMinutes - weeklyGoal.completedMinutes;
        reasons.push(`contributes ${task.estimatedMinutes} min toward your weekly goal (${remaining} min remaining)`);
      }
      
      if (task.cost) {
        reasons.push(`costs $${task.cost} within your budget`);
      } else {
        reasons.push('free activity');
      }
      
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
  tasks = [
    { id: '1', title: 'Morning jog', estimatedMinutes: 30, category: 'goal', completed: false },
    { id: '2', title: 'Read a book chapter', estimatedMinutes: 20, category: 'neutral', completed: false },
    { id: '3', title: 'Yoga session', estimatedMinutes: 45, category: 'goal', completed: false },
    { id: '4', title: 'Coffee with friend', estimatedMinutes: 60, cost: 15, category: 'neutral', completed: false },
    { id: '5', title: 'Gym workout', estimatedMinutes: 60, cost: 0, category: 'goal', completed: false },
    { id: '6', title: 'Watch a movie', estimatedMinutes: 120, cost: 12, category: 'neutral', completed: false },
    { id: '7', title: 'Quick stretch', estimatedMinutes: 10, category: 'goal', completed: false },
    { id: '8', title: 'Meditation', estimatedMinutes: 15, category: 'goal', completed: false },
  ];
  weeklyGoal = {
    id: '1',
    title: 'Exercise 150 minutes',
    targetMinutes: 150,
    completedMinutes: 45,
  };
  weeklyBudget = {
    id: '1',
    category: 'Entertainment & Wellness',
    limit: 100,
    spent: 27,
  };
};
