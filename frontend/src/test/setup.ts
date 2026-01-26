import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock state
let mockTasks = [
  { id: "1", title: "Task 1", estimatedMinutes: 30, goalId: "goal-1", energy: "low" as const, completed: false, completedMinutes: 0 },
  { id: "2", title: "Task 2", estimatedMinutes: 45, goalId: "goal-2", energy: "medium" as const, completed: false, completedMinutes: 0 },
];
let mockGoals = [
  { id: "goal-1", title: "Body Goal", type: "body" as const, targetMinutes: 100, completedMinutes: 20 },
  { id: "goal-2", title: "Mind Goal", type: "mind" as const, targetMinutes: 100, completedMinutes: 30 },
  { id: "goal-3", title: "Soul Goal", type: "soul" as const, targetMinutes: 100, completedMinutes: 40 },
];
let mockUser: any = null;
let mockToken: string | null = null;

const createResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => JSON.parse(JSON.stringify(data)),
  text: async () => JSON.stringify(data),
});

const mockFetch = vi.fn().mockImplementation((url: string, options: any) => {
  if (url.includes("/auth/login") || url.includes("/auth/signup")) {
    const body = JSON.parse(options.body);
    if (url.includes("/signup") && (!body.email || !body.password || !body.username)) {
      return Promise.resolve(createResponse({ detail: "All fields are required" }, false, 400));
    }
    if (url.includes("/login") && (!body.email || !body.password)) {
      return Promise.resolve(createResponse({ detail: "Email and password are required" }, false, 400));
    }
    if (body.password.length < 3) {
      return Promise.resolve(createResponse({ detail: "Invalid credentials" }, false, 401));
    }
    if (url.includes("/signup") && body.password.length < 6) {
      return Promise.resolve(createResponse({ detail: "Password must be at least 6 characters" }, false, 400));
    }
    mockUser = { id: "1", username: body.username || "test", email: body.email };
    mockToken = "mock-token";
    localStorageMock.setItem("token", mockToken);
    return Promise.resolve(createResponse({ user: mockUser, token: mockToken }));
  }

  if (url.includes("/auth/logout")) {
    mockUser = null;
    mockToken = null;
    localStorageMock.removeItem("token");
    return Promise.resolve(createResponse({ message: "Logged out" }));
  }

  if (url.includes("/auth/me")) {
    if (!localStorageMock.getItem("token")) return Promise.resolve(createResponse({ detail: "Unauthorized" }, false, 401));
    return Promise.resolve(createResponse(mockUser || { id: "1", username: "test", email: "test@example.com" }));
  }

  if (url.includes("/tasks")) {
    console.log("Tasks API called", options?.method, url);
    if (options?.method === "POST") {
      const body = JSON.parse(options.body);
      const newTask = { ...body, id: Math.random().toString(), completed: false };
      mockTasks.push(newTask);
      console.log("Added task", newTask, "Total tasks", mockTasks.length);
      return Promise.resolve(createResponse(newTask));
    }
    const taskIdMatch = url.match(/\/tasks\/([^/]+)$/);
    if (taskIdMatch && options?.method === "DELETE") {
      const id = taskIdMatch[1];
      mockTasks = mockTasks.filter(t => t.id !== id);
      return Promise.resolve(createResponse({ message: "Deleted" }));
    }
    const taskIdCompleteMatch = url.match(/\/tasks\/([^/]+)\/complete$/);
    if (taskIdCompleteMatch) {
      const id = taskIdCompleteMatch[1];
      const task = mockTasks.find(t => t.id === id);
      if (task) {
        task.completed = true;
        task.completedMinutes = task.estimatedMinutes;
        // Also update goal
        if (task.goalId) {
          const goal = mockGoals.find(g => g.id === task.goalId);
          if (goal) goal.completedMinutes += task.estimatedMinutes;
        }
        return Promise.resolve(createResponse(task));
      }
    }
    console.log("Returning tasks, count:", mockTasks.length);
    return Promise.resolve(createResponse(mockTasks));
  }

  if (url.includes("/goals")) {
    if (options?.method === "POST") {
      if (mockGoals.length >= 5) {
        return Promise.resolve(createResponse({ detail: "Maximum of 5 goals allowed" }, false, 400));
      }
      const body = JSON.parse(options.body);
      const newGoal = { ...body, id: Math.random().toString(), completedMinutes: 0 };
      mockGoals.push(newGoal);
      return Promise.resolve(createResponse(newGoal));
    }
    const goalIdMatch = url.match(/\/goals\/([^/]+)$/);
    if (goalIdMatch) {
      const id = goalIdMatch[1];
      if (options?.method === "DELETE") {
        if (mockGoals.length <= 3) {
          return Promise.resolve(createResponse({ detail: "Minimum of 3 goals required" }, false, 400));
        }
        mockGoals = mockGoals.filter(g => g.id !== id);
        return Promise.resolve(createResponse({ message: "Deleted" }));
      }
      if (options?.method === "PUT") {
        const body = JSON.parse(options.body);
        const goal = mockGoals.find(g => g.id === id);
        if (goal) {
          Object.assign(goal, body);
          return Promise.resolve(createResponse(goal));
        }
      }
    }
    return Promise.resolve(createResponse(mockGoals));
  }

  if (url.includes("/decision/recommendation")) {
    const searchParams = new URL(url, "http://localhost").searchParams;
    const availableMinutes = parseInt(searchParams.get("availableMinutes") || "0");
    const energyLevel = searchParams.get("energyLevel");

    const possibleTasks = mockTasks.filter(t => t.estimatedMinutes <= availableMinutes);
    if (possibleTasks.length === 0) return Promise.resolve(createResponse(null));

    // Simple filter for energy if needed
    let recommended = possibleTasks[0];
    if (energyLevel === 'low') {
      recommended = possibleTasks.find(t => t.energy === 'low') || recommended;
    }

    return Promise.resolve(createResponse({
      task: recommended,
      reason: "Fits your constraints",
      alternative: possibleTasks[1] || null,
      alternativeReason: possibleTasks[1] ? "Another good option" : null,
    }));
  }

  return Promise.resolve(createResponse({ message: "Not found" }, false, 404));
});

// Re-expose resetMockData for setup
(window as any).resetMockDataInternal = () => {
  console.log("Resetting mock data");
  mockTasks = [
    { id: "1", title: "Task 1", estimatedMinutes: 30, goalId: "goal-1", energy: "low" as const, completed: false, completedMinutes: 0 },
    { id: "2", title: "Task 2", estimatedMinutes: 45, goalId: "goal-2", energy: "medium" as const, completed: false, completedMinutes: 0 },
  ];
  mockGoals = [
    { id: "goal-1", title: "Body Goal", type: "body" as const, targetMinutes: 100, completedMinutes: 20 },
    { id: "goal-2", title: "Mind Goal", type: "mind" as const, targetMinutes: 100, completedMinutes: 30 },
    { id: "goal-3", title: "Soul Goal", type: "soul" as const, targetMinutes: 100, completedMinutes: 40 },
  ];
  mockUser = null;
  mockToken = null;
  localStorageMock.clear();
};

vi.stubGlobal("fetch", mockFetch);

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => { },
  }),
});
