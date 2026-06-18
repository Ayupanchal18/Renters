import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Flag } from 'lucide-react';
import { cn } from '../../lib/utils';

const SEVERITIES = [
  { value: 'low', label: 'Low', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400' },
  { value: 'medium', label: 'Medium', color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400' },
];

/**
 * FlagModal — collect severity + reason before flagging a conversation.
 * Props: open, onOpenChange, onSubmit(severity, reason), loading
 */
export default function FlagModal({ open, onOpenChange, onSubmit, loading }) {
  const [severity, setSeverity] = useState('medium');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    await onSubmit(severity, reason.trim());
    setReason('');
    setSeverity('medium');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-500" />
            Flag Conversation
          </DialogTitle>
          <DialogDescription>
            Select severity and provide a reason for flagging this conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Severity selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITIES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  className={cn(
                    'py-2 rounded-lg border text-sm font-medium transition-all',
                    severity === s.value
                      ? s.color + ' ring-2 ring-offset-1 ring-amber-400'
                      : 'border-border bg-background hover:bg-muted'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason <span className="text-destructive">*</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Describe why this conversation is being flagged..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground">{reason.length}/500 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? 'Flagging...' : 'Flag Conversation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
