import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-primary shadow-card">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg text-foreground">
            Now What?
          </span>
        </div>

        {/* User section */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                <User className="w-4 h-4 text-secondary-foreground" />
              </div>
              <span className="font-medium text-foreground hidden sm:inline">
                {user.username}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
