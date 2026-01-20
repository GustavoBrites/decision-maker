import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, Target, DollarSign, ArrowRight, Lightbulb } from 'lucide-react';
import { decisionApi, type Recommendation } from '@/lib/api';

const DecisionPanel: React.FC = () => {
  const [availableMinutes, setAvailableMinutes] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [noTasksAvailable, setNoTasksAvailable] = useState(false);

  const handleGetRecommendation = async () => {
    setIsLoading(true);
    setNoTasksAvailable(false);
    
    try {
      const result = await decisionApi.getRecommendation(parseInt(availableMinutes, 10));
      if (result) {
        setRecommendation(result);
        setNoTasksAvailable(false);
      } else {
        setRecommendation(null);
        setNoTasksAvailable(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          What Should I Do Now?
        </CardTitle>
        <CardDescription>
          Enter your available time and get a personalized recommendation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input section */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="available-time">Available Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="available-time"
                type="number"
                min="5"
                max="480"
                value={availableMinutes}
                onChange={(e) => setAvailableMinutes(e.target.value)}
                className="pl-10"
                placeholder="30"
              />
            </div>
            <p className="text-xs text-muted-foreground">minutes</p>
          </div>
          <Button 
            onClick={handleGetRecommendation} 
            disabled={isLoading || !availableMinutes}
            className="sm:mt-8 gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="animate-pulse-soft">Thinking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                What should I do?
              </>
            )}
          </Button>
        </div>

        {/* No tasks available message */}
        {noTasksAvailable && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
            <p className="text-center text-muted-foreground">
              No tasks fit your current constraints. Try increasing your available time or check your budget!
            </p>
          </div>
        )}

        {/* Recommendation result */}
        {recommendation && (
          <div className="space-y-4 animate-fade-in">
            {/* Main recommendation */}
            <div className="p-4 rounded-xl bg-gradient-primary text-primary-foreground">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-foreground/20 shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider opacity-80 mb-1">
                    Recommended
                  </p>
                  <h3 className="text-xl font-display font-bold">
                    {recommendation.task.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
                      <Clock className="w-3 h-3 mr-1" />
                      {recommendation.task.estimatedMinutes} min
                    </Badge>
                    {recommendation.task.cost !== undefined && recommendation.task.cost > 0 && (
                      <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {recommendation.task.cost}
                      </Badge>
                    )}
                    {recommendation.task.category === 'goal' && (
                      <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
                        <Target className="w-3 h-3 mr-1" />
                        Goal
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm opacity-90 leading-relaxed">
                {recommendation.reason}
              </p>
            </div>

            {/* Alternative */}
            {recommendation.alternative && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Alternative option
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {recommendation.alternative.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recommendation.alternative.estimatedMinutes} min
                      </span>
                      {recommendation.alternative.cost !== undefined && recommendation.alternative.cost > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {recommendation.alternative.cost}
                        </span>
                      )}
                    </div>
                  </div>
                  {recommendation.alternative.category === 'goal' && (
                    <Badge variant="outline" className="shrink-0">
                      <Target className="w-3 h-3 mr-1" />
                      Goal
                    </Badge>
                  )}
                </div>
                {recommendation.alternativeReason && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {recommendation.alternativeReason}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DecisionPanel;
