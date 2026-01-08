import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatsCard({ title, value, icon, description, trend, className }: StatsCardProps) {
  return (
    <div className={cn(
      'glass rounded-2xl p-6 transition-all duration-300 hover:glow-amber',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-display font-bold mt-2 text-foreground">{value}</p>
          {description && (
            <p className={cn(
              'text-sm mt-2',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-destructive',
              trend === 'neutral' && 'text-muted-foreground'
            )}>
              {description}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
