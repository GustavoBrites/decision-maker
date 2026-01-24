import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import ProgressCards from '@/components/ProgressCards';
import TaskList from '@/components/TaskList';
import DecisionPanel from '@/components/DecisionPanel';
import { tasksApi, goalApi, type Task, type WeeklyGoal } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, goalsData] = await Promise.all([
        tasksApi.getTasks(),
        goalApi.getWeeklyGoals(),
      ]);
      setTasks(tasksData);
      setGoals(goalsData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddTask = async (task: Omit<Task, 'id' | 'completed' | 'completedMinutes'>) => {
    const newTask = await tasksApi.addTask(task);
    setTasks(prev => [...prev, newTask]);
  };

  const handleCompleteTask = async (taskId: string) => {
    const updatedTask = await tasksApi.completeTask(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    // Refresh goals as they may have changed
    const goalsData = await goalApi.getWeeklyGoals();
    setGoals(goalsData);
  };

  const handleResetTask = async (taskId: string) => {
    const updatedTask = await tasksApi.resetTask(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    // Refresh goals
    const goalsData = await goalApi.getWeeklyGoals();
    setGoals(goalsData);
  };

  const handleDeleteTask = async (taskId: string) => {
    await tasksApi.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Omit<WeeklyGoal, 'id'>>) => {
    const updatedGoal = await goalApi.updateGoal(goalId, updates);
    setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
  };

  const handleEditTask = async (taskId: string, updates: Partial<Omit<Task, 'id' | 'completed' | 'completedMinutes'>>) => {
    const updatedTask = await tasksApi.updateTask(taskId, updates);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
  };

  const handleAddGoal = async (goal: Omit<WeeklyGoal, 'id' | 'completedMinutes'>) => {
    const newGoal = await goalApi.addGoal(goal);
    setGoals(prev => [...prev, newGoal]);
  };

  const handleDeleteGoal = async (goalId: string) => {
    await goalApi.deleteGoal(goalId);
    setGoals(prev => prev.filter(g => g.id !== goalId));
    // Refresh tasks as some may have been unlinked
    const tasksData = await tasksApi.getTasks();
    setTasks(tasksData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome message */}
          <div className="animate-fade-in">
            <h1 className="text-2xl font-display font-bold text-foreground">
              Welcome back!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your weekly progress and what you could do today.
            </p>
          </div>

          {/* Progress Cards */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <ProgressCards
              goals={goals}
              onUpdateGoal={handleUpdateGoal}
              onAddGoal={handleAddGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          </div>

          {/* Decision Panel */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <DecisionPanel goals={goals} />
          </div>

          {/* Task List */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <TaskList
              tasks={tasks}
              goals={goals}
              onAddTask={handleAddTask}
              onCompleteTask={handleCompleteTask}
              onResetTask={handleResetTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
