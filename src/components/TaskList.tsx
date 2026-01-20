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
import { Plus, Clock, DollarSign, Target, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import type { Task } from '@/lib/api';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'completedMinutes'>) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  onResetTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onAddTask, 
  onCompleteTask, 
  onResetTask,
  onDeleteTask 
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState<'goal' | 'neutral'>('neutral');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onAddTask({
        title,
        estimatedMinutes: parseInt(estimatedMinutes, 10),
        cost: cost ? parseFloat(cost) : undefined,
        category,
      });
      
      // Reset form
      setTitle('');
      setEstimatedMinutes('');
      setCost('');
      setCategory('neutral');
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
                <div className="space-y-2">
                  <Label htmlFor="task-cost">Cost (optional)</Label>
                  <Input
                    id="task-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as 'goal' | 'neutral')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goal">Goal-related</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
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
                onComplete={onCompleteTask}
                onReset={onResetTask}
                onDelete={onDeleteTask}
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
                  onComplete={onCompleteTask}
                  onReset={onResetTask}
                  onDelete={onDeleteTask}
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
  onComplete: (taskId: string) => Promise<void>;
  onReset: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete, onReset, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        task.completed 
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
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.estimatedMinutes} min
          </span>
          {task.cost !== undefined && task.cost > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {task.cost}
            </span>
          )}
        </div>
      </div>

      {/* Category badge */}
      <Badge 
        variant={task.category === 'goal' ? 'default' : 'secondary'}
        className="shrink-0"
      >
        {task.category === 'goal' && <Target className="w-3 h-3 mr-1" />}
        {task.category === 'goal' ? 'Goal' : 'Neutral'}
      </Badge>

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
  );
};

export default TaskList;
