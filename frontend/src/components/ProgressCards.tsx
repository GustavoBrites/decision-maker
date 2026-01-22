import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Target, Heart, Brain, Sparkles, Plus, Pencil, Trash2 } from 'lucide-react';
import type { WeeklyGoal, GoalType } from '@/lib/api';

interface ProgressCardsProps {
  goals: WeeklyGoal[];
  onUpdateGoal: (goalId: string, updates: Partial<Omit<WeeklyGoal, 'id'>>) => Promise<void>;
  onAddGoal: (goal: Omit<WeeklyGoal, 'id' | 'completedMinutes'>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

const goalTypeIcons: Record<GoalType, React.ReactNode> = {
  body: <Heart className="h-4 w-4 text-rose-500" />,
  mind: <Brain className="h-4 w-4 text-blue-500" />,
  soul: <Sparkles className="h-4 w-4 text-purple-500" />,
  custom: <Target className="h-4 w-4 text-primary" />,
};

const goalTypeLabels: Record<GoalType, string> = {
  body: 'Body',
  mind: 'Mind',
  soul: 'Soul',
  custom: 'Custom',
};

const goalTypeColors: Record<GoalType, string> = {
  body: 'bg-rose-500/10',
  mind: 'bg-blue-500/10',
  soul: 'bg-purple-500/10',
  custom: 'bg-primary/10',
};

const ProgressCards: React.FC<ProgressCardsProps> = ({ 
  goals, 
  onUpdateGoal, 
  onAddGoal,
  onDeleteGoal 
}) => {
  const canAddGoal = goals.length < 5;
  const canDeleteGoal = goals.length > 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold text-foreground">Weekly Goals</h2>
        {canAddGoal && <AddGoalDialog onAddGoal={onAddGoal} />}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onUpdate={onUpdateGoal}
            onDelete={onDeleteGoal}
            canDelete={canDeleteGoal}
          />
        ))}
      </div>
    </div>
  );
};

interface GoalCardProps {
  goal: WeeklyGoal;
  onUpdate: (goalId: string, updates: Partial<Omit<WeeklyGoal, 'id'>>) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
  canDelete: boolean;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onUpdate, onDelete, canDelete }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editTarget, setEditTarget] = useState(goal.targetMinutes.toString());
  const [isLoading, setIsLoading] = useState(false);

  const goalProgress = Math.min((goal.completedMinutes / goal.targetMinutes) * 100, 100);
  const goalRemaining = Math.max(goal.targetMinutes - goal.completedMinutes, 0);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate(goal.id, {
        title: editTitle,
        targetMinutes: parseInt(editTarget, 10),
      });
      setIsEditOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(goal.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {goalTypeLabels[goal.type]}
        </CardTitle>
        <div className="flex items-center gap-1">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${goalTypeColors[goal.type]}`}>
            {goalTypeIcons[goal.type]}
          </div>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Goal</DialogTitle>
                <DialogDescription>
                  Update your weekly goal target
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target Minutes</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    min="1"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="mr-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-foreground font-medium">{goal.title}</p>
          <p className="text-2xl font-display font-bold text-foreground">
            {goal.completedMinutes}
            <span className="text-base font-normal text-muted-foreground ml-1">
              / {goal.targetMinutes} min
            </span>
          </p>
        </div>
        <Progress value={goalProgress} variant="goal" />
        <p className="text-xs text-muted-foreground">
          {goalRemaining > 0 
            ? `${goalRemaining} minutes remaining this week`
            : '🎉 Goal achieved!'
          }
        </p>
      </CardContent>
    </Card>
  );
};

interface AddGoalDialogProps {
  onAddGoal: (goal: Omit<WeeklyGoal, 'id' | 'completedMinutes'>) => Promise<void>;
}

const AddGoalDialog: React.FC<AddGoalDialogProps> = ({ onAddGoal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('60');
  const [type, setType] = useState<GoalType>('custom');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onAddGoal({
        title,
        targetMinutes: parseInt(targetMinutes, 10),
        type,
      });
      setTitle('');
      setTargetMinutes('60');
      setType('custom');
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
          <DialogDescription>
            Create a new weekly goal (max 5 goals)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-goal-title">Goal Title</Label>
            <Input
              id="new-goal-title"
              placeholder="e.g., Exercise 150 minutes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-goal-target">Target Minutes</Label>
              <Input
                id="new-goal-target"
                type="number"
                min="1"
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-goal-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="body">Body</SelectItem>
                  <SelectItem value="mind">Mind</SelectItem>
                  <SelectItem value="soul">Soul</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressCards;
