import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import {
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Building2,
  Shield,
  Settings,
  FileText,
  Bell,
  Star,
  Clock
} from 'lucide-react';

/**
 * Activity Feed Component
 * 
 * Displays recent admin activity logs with timestamps
 */

const actionIcons = {
  CREATE: UserPlus,
  UPDATE: Edit,
  DELETE: Trash2,
  ROLE_CHANGE: Shield,
  STATUS_CHANGE: Settings,
  APPROVE: Star,
  REJECT: Star,
  BLOCK: UserMinus,
  UNBLOCK: UserPlus,
  DEFAULT: FileText
};

const resourceIcons = {
  user: UserPlus,
  property: Building2,
  content: FileText,
  notification: Bell,
  review: Star,
  settings: Settings,
  DEFAULT: FileText
};

const actionColors = {
  CREATE: 'text-green-600 dark:text-green-400 bg-green-500/10',
  UPDATE: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  DELETE: 'text-red-600 dark:text-red-400 bg-red-500/10',
  ROLE_CHANGE: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  STATUS_CHANGE: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  APPROVE: 'text-green-600 dark:text-green-400 bg-green-500/10',
  REJECT: 'text-red-600 dark:text-red-400 bg-red-500/10',
  BLOCK: 'text-red-600 dark:text-red-400 bg-red-500/10',
  UNBLOCK: 'text-green-600 dark:text-green-400 bg-green-500/10',
  DEFAULT: 'text-muted-foreground bg-muted'
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatAction = (action, resourceType) => {
  const actionText = action?.toLowerCase().replace(/_/g, ' ') || 'performed action';
  const resourceText = resourceType?.toLowerCase() || 'resource';
  return `${actionText} ${resourceText}`;
};

const ActivityItem = ({ activity }) => {
  const { action, resourceType, adminId, timestamp, changes } = activity;
  
  const ActionIcon = actionIcons[action] || actionIcons.DEFAULT;
  const colorClass = actionColors[action] || actionColors.DEFAULT;
  const adminName = adminId?.name || adminId?.email || 'Unknown Admin';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
        <ActionIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-medium">{adminName}</span>
          {' '}
          <span className="text-muted-foreground">{formatAction(action, resourceType)}</span>
        </p>
        {changes && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {typeof changes === 'string' ? changes : JSON.stringify(changes).slice(0, 50)}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );
};

const ActivityItemSkeleton = () => (
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

const ActivityFeed = ({ 
  activities = [], 
  loading = false, 
  title = 'Recent Activity',
  maxItems = 10,
  showViewAll = true,
  onViewAll
}) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:underline"
          >
            View all
          </button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <ActivityItemSkeleton key={i} />
            ))}
          </div>
        ) : displayActivities.length > 0 ? (
          <div className="space-y-0">
            {displayActivities.map((activity, index) => (
              <ActivityItem key={activity._id || index} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
