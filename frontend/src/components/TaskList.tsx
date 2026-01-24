import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Clock, Target, CheckCircle2, RotateCcw, Trash2, Zap, Heart, Brain, Sparkles } from 'lucide-react';
import type { Task, WeeklyGoal, EnergyLevel } from '@/lib/api';

interface TaskListProps {
  tasks: Task[];
  goals: WeeklyGoal[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'completedMinutes'>) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  onResetTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onEditTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'completed' | 'completedMinutes'>>) => Promise<void>;
}



const energyLabels: Record<EnergyLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const energyColors: Record<EnergyLevel, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const goalTypeIcons: Record<string, React.ReactNode> = {
  body: <Heart className="w-3 h-3" />,
  mind: <Brain className="w-3 h-3" />,
  soul: <Sparkles className="w-3 h-3" />,
  custom: <Target className="w-3 h-3" />,
};

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  goals,
  onAddTask,
  onCompleteTask,
  onResetTask,
  onDeleteTask,
  onEditTask
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  const [goalId, setGoalId] = useState<string>('none');
  const [energy, setEnergy] = useState<EnergyLevel>('medium');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onAddTask({
        title,
        estimatedMinutes: parseInt(estimatedMinutes, 10),
        goalId: goalId === 'none' ? null : goalId,
        energy,
      });

      // Reset form
      setTitle('');
      setEstimatedMinutes('');

      setGoalId('none');
      setEnergy('medium');
      setIsAddDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display">Your Tasks</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a task to add to your weekly options
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Morning jog"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-time">Time (minutes)</Label>
                  <Input
                    id="task-time"
                    type="number"
                    min="1"
                    placeholder="30"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-goal">Related Goal</Label>
                  <Select value={goalId} onValueChange={setGoalId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No goal (neutral)</SelectItem>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-energy">Energy Required</Label>
                  <Select value={energy} onValueChange={(v) => setEnergy(v as EnergyLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Task'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Incomplete Tasks */}
        {incompleteTasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No tasks yet. Add your first task to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {incompleteTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                goals={goals}
                onComplete={onCompleteTask}
                onReset={onResetTask}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
              />
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Completed ({completedTasks.length})
            </p>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  goals={goals}
                  onComplete={onCompleteTask}
                  onReset={onResetTask}
                  onDelete={onDeleteTask}
                  onEdit={onEditTask}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TaskItemProps {
  task: Task;
  goals: WeeklyGoal[];
  onComplete: (taskId: string) => Promise<void>;
  onReset: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onEdit: (taskId: string, updates: Partial<Omit<Task, 'id' | 'completed' | 'completedMinutes'>>) => Promise<void>;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, goals, onComplete, onReset, onDelete, onEdit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [title, setTitle] = useState(task.title);
  const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimatedMinutes.toString());
  const [goalId, setGoalId] = useState<string>(task.goalId || 'none');
  const [energy, setEnergy] = useState<EnergyLevel>(task.energy);

  const linkedGoal = task.goalId ? goals.find(g => g.id === task.goalId) : null;

  const handleAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      await onEdit(task.id, {
        title,
        estimatedMinutes: parseInt(estimatedMinutes, 10),
        goalId: goalId === 'none' ? undefined : (goalId === (task.goalId || 'none') ? undefined : (goalId === 'none' ? null : goalId)), // Handle null/undefined logic carefully. API partial update logic: if passed, update.
        // Actually, API: if passed, update. If we want to clear goalId, we need to pass something.
        // My backend implementation used request.goalId: Optional[UUID]. If set, update.
        // Frontend logic for 'none': we want to pass null maybe? Backend pydantic expects UUID or None.
        // If we pass null to backend, it should work if Optional[UUID] allows None.
        // Let's ensure we pass the right thing.
        // Simpler: just pass the value. 'none' -> null.
        energy
      });
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to edit task", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapper for onEdit to match signature expectation if we needed one, but we call it directly.

  return (
    <>
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${task.completed
          ? 'bg-muted/50 border-border/50 opacity-60'
          : 'bg-card border-border hover:shadow-card'
          }`}
      >
        {/* Complete/Reset button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => handleAction(task.completed ? () => onReset(task.id) : () => onComplete(task.id))}
          disabled={isLoading}
        >
          {task.completed ? (
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-primary" />
          )}
        </Button>

        {/* Task details */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !task.completed && setIsEditing(true)}>
          <p className={`font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground hover:underline'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.estimatedMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {energyLabels[task.energy]}
            </span>
          </div>
        </div>

        {/* Goal/Energy badges */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={`${energyColors[task.energy]} border-0`}>
            {energyLabels[task.energy]}
          </Badge>
          {linkedGoal ? (
            <Badge variant="default" className="shrink-0">
              {goalTypeIcons[linkedGoal.type]}
              <span className="ml-1">{linkedGoal.type.charAt(0).toUpperCase() + linkedGoal.type.slice(1)}</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              Neutral
            </Badge>
          )}
        </div>

        {/* Edit button (implicit via click on text, or explicit?) Let's keep delete separate */}

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => handleAction(() => onDelete(task.id))}
          disabled={isLoading}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-task-title-${task.id}`}>Task Title</Label>
              <Input
                id={`edit-task-title-${task.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-task-time-${task.id}`}>Time (minutes)</Label>
              <Input
                id={`edit-task-time-${task.id}`}
                type="number"
                min="1"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`edit-task-goal-${task.id}`}>Related Goal</Label>
                <Select value={goalId} onValueChange={setGoalId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No goal (neutral)</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-task-energy-${task.id}`}>Energy Required</Label>
                <Select value={energy} onValueChange={(v) => setEnergy(v as EnergyLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskList;
