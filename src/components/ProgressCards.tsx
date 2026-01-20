import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Wallet } from 'lucide-react';
import type { WeeklyGoal, WeeklyBudget } from '@/lib/api';

interface ProgressCardsProps {
  goal: WeeklyGoal;
  budget: WeeklyBudget;
}

const ProgressCards: React.FC<ProgressCardsProps> = ({ goal, budget }) => {
  const goalProgress = Math.min((goal.completedMinutes / goal.targetMinutes) * 100, 100);
  const goalRemaining = Math.max(goal.targetMinutes - goal.completedMinutes, 0);
  
  const budgetProgress = Math.min((budget.spent / budget.limit) * 100, 100);
  const budgetRemaining = Math.max(budget.limit - budget.spent, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Goal Progress Card */}
      <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Weekly Goal
          </CardTitle>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
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

      {/* Budget Card */}
      <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Weekly Budget
          </CardTitle>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
            <Wallet className="h-4 w-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-foreground font-medium">{budget.category}</p>
            <p className="text-2xl font-display font-bold text-foreground">
              ${budgetRemaining.toFixed(0)}
              <span className="text-base font-normal text-muted-foreground ml-1">
                remaining
              </span>
            </p>
          </div>
          <Progress value={budgetProgress} variant="budget" />
          <p className="text-xs text-muted-foreground">
            ${budget.spent.toFixed(0)} spent of ${budget.limit} limit
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressCards;
