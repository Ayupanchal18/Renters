import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  X, Download, CheckSquare, AlertTriangle,
  UserX, UserCheck, Trash2, XCircle, CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';

/**
 * BulkActionToolbar — sticky floating bar at the bottom of tables when rows are selected.
 *
 * Props:
 *  selectedIds  — array of selected record IDs
 *  entityType   — 'users' | 'properties' | 'reviews'
 *  actions      — array of { key, label, icon, variant } available actions
 *  onAction     — async fn(actionKey, ids) called after confirm
 *  onClear      — clears selection
 *  loading      — disable all buttons
 */

const ENTITY_DEFAULTS = {
  users: [
    { key: 'block',      label: 'Block',        icon: UserX,        variant: 'warning' },
    { key: 'unblock',    label: 'Unblock',      icon: UserCheck,    variant: 'default' },
    { key: 'deactivate', label: 'Deactivate',   icon: XCircle,      variant: 'warning' },
    { key: 'delete',     label: 'Delete',       icon: Trash2,       variant: 'destructive' },
    { key: 'export',     label: 'Export CSV',   icon: Download,     variant: 'outline' },
  ],
  properties: [
    { key: 'approve',    label: 'Approve',      icon: CheckCircle,  variant: 'default' },
    { key: 'reject',     label: 'Reject',       icon: XCircle,      variant: 'warning' },
    { key: 'export',     label: 'Export CSV',   icon: Download,     variant: 'outline' },
  ],
  reviews: [
    { key: 'approve',    label: 'Approve',      icon: CheckCircle,  variant: 'default' },
    { key: 'reject',     label: 'Reject',       icon: XCircle,      variant: 'destructive' },
    { key: 'export',     label: 'Export CSV',   icon: Download,     variant: 'outline' },
  ],
};

const DESTRUCTIVE_ACTIONS = new Set(['delete', 'block', 'deactivate', 'reject']);

export default function BulkActionToolbar({
  selectedIds = [],
  entityType = 'users',
  actions,
  onAction,
  onClear,
  loading = false,
}) {
  const [confirmAction, setConfirmAction] = useState(null); // { key, label }
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const resolvedActions = actions || ENTITY_DEFAULTS[entityType] || [];

  const handleActionClick = (action) => {
    if (DESTRUCTIVE_ACTIONS.has(action.key)) {
      setConfirmAction(action);
      setReason('');
    } else {
      executeAction(action.key);
    }
  };

  const executeAction = async (actionKey) => {
    setActionLoading(true);
    try {
      await onAction?.(actionKey, selectedIds, reason);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setReason('');
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      {/* Floating bar */}
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-3 px-5 py-3',
          'bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-2xl',
          'border border-white/10 backdrop-blur-sm',
          'animate-in slide-in-from-bottom-4 duration-200'
        )}
      >
        {/* Count */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/20">
          <CheckSquare className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-semibold whitespace-nowrap">
            {selectedIds.length} selected
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {resolvedActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.key}
                size="sm"
                variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
                className={cn(
                  'h-8 gap-1.5 text-xs font-medium',
                  action.variant === 'destructive'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : action.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : action.variant === 'default'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'text-white hover:bg-white/10'
                )}
                onClick={() => handleActionClick(action)}
                disabled={loading || actionLoading}
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            );
          })}
        </div>

        {/* Clear */}
        <button
          onClick={onClear}
          className="ml-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Confirm Modal */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Bulk {confirmAction?.label}
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to <strong>{confirmAction?.label?.toLowerCase()}</strong>{' '}
              <strong>{selectedIds.length}</strong> {entityType}.
              This action cannot be easily undone.
            </DialogDescription>
          </DialogHeader>

          {/* Red warning banner */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
            <strong>{selectedIds.length}</strong> records will be affected by this action.
          </div>

          {/* Optional reason */}
          {(confirmAction?.key === 'block' || confirmAction?.key === 'reject' || confirmAction?.key === 'delete') && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                placeholder="Enter reason for this action..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => executeAction(confirmAction.key)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : `${confirmAction?.label} ${selectedIds.length} items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
