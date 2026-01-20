import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import ProgressCards from '@/components/ProgressCards';
import TaskList from '@/components/TaskList';
import DecisionPanel from '@/components/DecisionPanel';
import { tasksApi, goalApi, budgetApi, type Task, type WeeklyGoal, type WeeklyBudget } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [budget, setBudget] = useState<WeeklyBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, goalData, budgetData] = await Promise.all([
        tasksApi.getTasks(),
        goalApi.getWeeklyGoal(),
        budgetApi.getWeeklyBudget(),
      ]);
      setTasks(tasksData);
      setGoal(goalData);
      setBudget(budgetData);
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
    // Refresh goal and budget as they may have changed
    const [goalData, budgetData] = await Promise.all([
      goalApi.getWeeklyGoal(),
      budgetApi.getWeeklyBudget(),
    ]);
    setGoal(goalData);
    setBudget(budgetData);
  };

  const handleResetTask = async (taskId: string) => {
    const updatedTask = await tasksApi.resetTask(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    // Refresh goal and budget
    const [goalData, budgetData] = await Promise.all([
      goalApi.getWeeklyGoal(),
      budgetApi.getWeeklyBudget(),
    ]);
    setGoal(goalData);
    setBudget(budgetData);
  };

  const handleDeleteTask = async (taskId: string) => {
    await tasksApi.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid gap-4 sm:grid-cols-2">
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
          {goal && budget && (
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <ProgressCards goal={goal} budget={budget} />
            </div>
          )}

          {/* Decision Panel */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <DecisionPanel />
          </div>

          {/* Task List */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <TaskList
              tasks={tasks}
              onAddTask={handleAddTask}
              onCompleteTask={handleCompleteTask}
              onResetTask={handleResetTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
