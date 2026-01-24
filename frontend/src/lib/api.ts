// Centralized API layer for Now What? app
// Interacts with the backend via fetch

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

const API_BASE_URL = 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      // generic unauthorized handling if needed
    }
    const errorData = await response.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(errorData.detail || 'API request failed');
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    localStorage.setItem('token', data.token);
    return data;
  },

  async signup(email: string, password: string, username: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });
    const data = await handleResponse(response);
    localStorage.setItem('token', data.token);
    return data;
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    await handleResponse(response);
    localStorage.removeItem('token');
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return await handleResponse(response);
    } catch (e) {
      console.warn('Failed to get current user', e);
      localStorage.removeItem('token');
      return null;
    }
  },
};

// Tasks API
export const tasksApi = {
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  async addTask(task: Omit<Task, 'id' | 'completed' | 'completedMinutes'>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    return await handleResponse(response);
  },

  async updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'completed' | 'completedMinutes'>>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return await handleResponse(response);
  },

  async completeTask(taskId: string, actualMinutes?: number): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ actualMinutes }),
    });
    return await handleResponse(response);
  },

  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(response);
  },

  async resetTask(taskId: string): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/reset`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },
};

// Goals API
export const goalApi = {
  async getWeeklyGoals(): Promise<WeeklyGoal[]> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await handleResponse(response);
  },

  async getWeeklyGoal(): Promise<WeeklyGoal> {
    // Backward compatibility - return first goal from the list
    const goals = await this.getWeeklyGoals();
    if (goals.length > 0) {
      return goals[0];
    }
    // If no goals, create a dummy or throw error? 
    // For now returning a dummy structure or handling empty state in components might be better
    // But let's verify what the backend returns.
    // If empty list, we return a mock empty object to avoid crashes if possible, or expect component to handle it.
    throw new Error("No goals found");
  },

  async addGoal(goal: Omit<WeeklyGoal, 'id' | 'completedMinutes'>): Promise<WeeklyGoal> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goal),
    });
    return await handleResponse(response);
  },

  async updateGoal(goalId: string, updates: Partial<Omit<WeeklyGoal, 'id'>>): Promise<WeeklyGoal> {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return await handleResponse(response);
  },

  async deleteGoal(goalId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(response);
  },

  async updateWeeklyGoal(updates: Partial<WeeklyGoal>): Promise<WeeklyGoal> {
    // This was supporting the single-goal legacy view.
    // We need to fetch goals and update the first one or logic similar to getWeeklyGoal
    const goals = await this.getWeeklyGoals();
    if (goals.length === 0) {
      throw new Error("No goal to update");
    }
    const goalId = goals[0].id;
    return this.updateGoal(goalId, updates);
  },
};

// Decision/Recommendation API
export const decisionApi = {
  async getRecommendation(availableMinutes: number, energyLevel: EnergyLevel): Promise<Recommendation | null> {
    const params = new URLSearchParams({
      availableMinutes: availableMinutes.toString(),
      energyLevel,
    });
    const response = await fetch(`${API_BASE_URL}/decision/recommendation?${params}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    // API might return 404/null if no recommendation, or a specific structure
    // Our backend currently always returns a recommendation or a "Free Time" task.
    // So we just parse JSON.
    return await handleResponse(response);
  },
};

// No longer needed, but keeping for compatibility if imported elsewhere, but empty or warning
export const resetMockData = () => {
  console.warn("resetMockData called but running in real API mode.");
};
