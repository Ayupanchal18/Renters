import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * FrictionConfirmModal Component
 * 
 * Reusable modal for destructive/high-risk administrative actions.
 * Supports type-to-confirm input and mandatory reason inputs.
 */
const FrictionConfirmModal = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm Action',
  actionText, // Required text input (e.g. 'DELETE')
  variant = 'destructive', // 'destructive', 'warning', 'info'
  requiresReason = false,
  reasonPlaceholder = 'Please enter a reason for this action...',
  onConfirm,
  loading = false
}) => {
  const [typedText, setTypedText] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  // Reset inputs when modal state changes
  useEffect(() => {
    if (open) {
      setTypedText('');
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check confirmation text match
    if (actionText && typedText !== actionText) {
      setError(`Please type "${actionText}" to confirm.`);
      return;
    }

    // Check reason requirement
    if (requiresReason && !reason.trim()) {
      setError('A reason is required to complete this action.');
      return;
    }

    setError(null);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  // Determine variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          titleColor: 'text-red-600 dark:text-red-400',
          icon: <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />,
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
        };
      case 'warning':
        return {
          titleColor: 'text-amber-600 dark:text-amber-400',
          icon: <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500'
        };
      case 'info':
      default:
        return {
          titleColor: 'text-blue-600 dark:text-blue-400',
          icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
          buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
        };
    }
  };

  const { titleColor, icon, buttonClass } = getVariantStyles();

  // Validate if the confirm button should be enabled
  const isValid = (!actionText || typedText === actionText) && (!requiresReason || reason.trim().length >= 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2 font-bold", titleColor)}>
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Reason Field */}
          {requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason-input" className="text-sm font-semibold">
                Reason for action <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason-input"
                placeholder={reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 4 characters required.
              </p>
            </div>
          )}

          {/* Friction Action Text field */}
          {actionText && (
            <div className="space-y-2">
              <Label htmlFor="action-confirm" className="text-sm font-semibold">
                To confirm, type <span className="font-mono text-red-600 dark:text-red-400 select-all font-bold">"{actionText}"</span> below:
              </Label>
              <Input
                id="action-confirm"
                type="text"
                placeholder={`Type ${actionText}...`}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                disabled={loading}
                autoComplete="off"
                className="font-mono"
                required
              />
            </div>
          )}

          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={buttonClass}
              disabled={loading || !isValid}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {confirmText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FrictionConfirmModal;
