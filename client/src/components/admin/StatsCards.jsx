import { cn } from '../../lib/utils';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import {
  Users,
  Building2,
  UserCheck,
  UserCog,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

/**
 * Stats Cards Component
 * 
 * Displays key metrics for the admin dashboard including:
 * - Total users, owners, agents, and properties
 * - Active vs inactive listing counts
 * 
 * Requirements: 2.1 - Display total counts for users, owners, agents, and properties
 * Requirements: 2.2 - Show active versus inactive listing counts
 */

const StatCard = ({ title, value, icon: Icon, trend, trendValue, description, variant = 'default' }) => {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-primary/5 border-primary/20',
    success: 'bg-green-500/5 border-green-500/20',
    warning: 'bg-amber-500/5 border-amber-500/20',
    info: 'bg-blue-500/5 border-blue-500/20'
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value?.toLocaleString() ?? '—'}</p>
            {(trend || description) && (
              <div className="flex items-center gap-2">
                {trend && trendValue !== undefined && (
                  <span className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    <TrendIcon className="h-3 w-3" />
                    {trendValue}%
                  </span>
                )}
                {description && (
                  <span className="text-xs text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </CardContent>
  </Card>
);

const StatsCards = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { users, properties } = stats || {};

  const cards = [
    {
      title: 'Total Users',
      value: users?.total,
      icon: Users,
      description: `${users?.newThisMonth ?? 0} new this month`,
      variant: 'primary'
    },
    {
      title: 'Owners',
      value: users?.byRole?.owner ?? 0,
      icon: UserCheck,
      variant: 'success'
    },
    {
      title: 'Agents',
      value: users?.byRole?.agent ?? 0,
      icon: UserCog,
      variant: 'info'
    },
    {
      title: 'Admins',
      value: users?.byRole?.admin ?? 0,
      icon: Activity,
      variant: 'warning'
    },
    {
      title: 'Total Properties',
      value: properties?.total,
      icon: Building2,
      variant: 'primary'
    },
    {
      title: 'Active Listings',
      value: properties?.active,
      icon: TrendingUp,
      variant: 'success'
    },
    {
      title: 'Inactive Listings',
      value: properties?.inactive,
      icon: TrendingDown,
      variant: 'warning'
    },
    {
      title: 'Pending Review',
      value: properties?.pending,
      icon: Activity,
      variant: 'info'
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
};

export default StatsCards;
