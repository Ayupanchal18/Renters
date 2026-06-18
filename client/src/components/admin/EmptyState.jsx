import { Users, Building2, FileText, ShieldAlert, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

/**
 * EmptyState — shared component for all list-view empty states.
 *
 * Props:
 *  icon        — lucide icon name or component (default: Inbox)
 *  title       — primary heading
 *  description — supporting text
 *  action      — { label, onClick } for CTA button (optional)
 *  variant     — 'empty' | 'filtered' | 'error'
 */

const ICON_MAP = {
  users: Users,
  properties: Building2,
  content: FileText,
  security: ShieldAlert,
};

const VARIANT_STYLES = {
  empty: {
    container: 'bg-muted/30',
    icon: 'text-muted-foreground',
    title: 'text-foreground',
  },
  filtered: {
    container: 'bg-muted/20',
    icon: 'text-muted-foreground',
    title: 'text-foreground',
  },
  error: {
    container: 'bg-destructive/5 border border-destructive/20',
    icon: 'text-destructive',
    title: 'text-destructive',
  },
};

export default function EmptyState({
  icon,
  title = 'No data found',
  description,
  action,
  variant = 'empty',
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.empty;

  // Resolve icon component
  let IconComponent = Inbox;
  if (typeof icon === 'string') {
    IconComponent = ICON_MAP[icon] || Inbox;
  } else if (icon) {
    IconComponent = icon;
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl py-16 px-6 text-center',
        styles.container
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm',
        )}
      >
        <IconComponent className={cn('h-8 w-8', styles.icon)} />
      </div>

      <h3 className={cn('text-lg font-semibold mb-1', styles.title)}>
        {title}
      </h3>

      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant={variant === 'error' ? 'destructive' : 'default'}
          size="sm"
          onClick={action.onClick}
          className="mt-1"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
