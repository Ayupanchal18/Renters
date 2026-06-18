import { useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import {
  Flag, ArrowUpCircle, CheckCircle2, BellRing,
  UserX, FileDown, AlertTriangle, Loader2
} from 'lucide-react';

/**
 * ConversationActions — moderation sidebar for a selected conversation.
 * Props:
 *  conversation — the currently viewed conversation object
 *  onAction     — async fn(actionKey, payload) → called by action buttons
 *  loading      — disable all while action in progress
 */

const ACTION_LIST = [
  {
    key: 'flag',
    label: 'Flag Conversation',
    icon: Flag,
    variant: 'warning',
    description: 'Mark with severity level and reason',
  },
  {
    key: 'escalate',
    label: 'Escalate',
    icon: ArrowUpCircle,
    variant: 'purple',
    description: 'Assign to senior admin',
  },
  {
    key: 'resolve',
    label: 'Mark Resolved',
    icon: CheckCircle2,
    variant: 'success',
    description: 'Clear flag, mark as resolved',
  },
  {
    key: 'warn',
    label: 'Warn Participants',
    icon: BellRing,
    variant: 'default',
    description: 'Send notification to both parties',
  },
  {
    key: 'block-participant',
    label: 'Block Participant',
    icon: UserX,
    variant: 'destructive',
    description: 'Route to user management block flow',
  },
  {
    key: 'export',
    label: 'Export Transcript',
    icon: FileDown,
    variant: 'outline',
    description: 'Download full conversation as PDF',
  },
];

const VARIANT_CLASSES = {
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  default: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  destructive: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
};

export default function ConversationActions({ conversation, onAction, loading }) {
  const [activeAction, setActiveAction] = useState(null);

  const handleAction = async (action) => {
    setActiveAction(action.key);
    try {
      await onAction?.(action.key, { conversationId: conversation?._id });
    } finally {
      setActiveAction(null);
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
        <AlertTriangle className="h-6 w-6 mb-2 opacity-40" />
        <p className="text-sm">Select a conversation to see moderation actions</p>
      </div>
    );
  }

  const flagStatus = conversation.flagStatus || 'none';

  return (
    <div className="flex flex-col h-full p-4 space-y-3">
      {/* Conversation status */}
      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</h3>
        <div className="flex items-center gap-2">
          <div className={cn(
            'h-2 w-2 rounded-full',
            flagStatus === 'none' ? 'bg-gray-400' :
            flagStatus === 'low' ? 'bg-yellow-400' :
            flagStatus === 'medium' ? 'bg-orange-500' :
            flagStatus === 'high' ? 'bg-red-500' :
            flagStatus === 'escalated' ? 'bg-purple-500' :
            'bg-emerald-500'
          )} />
          <span className="text-sm capitalize font-medium">{flagStatus === 'none' ? 'No flags' : flagStatus}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {conversation.messageCount || 0} messages · Last active {
            conversation.lastActivityAt
              ? new Date(conversation.lastActivityAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
              : '—'
          }
        </p>
      </div>

      {/* Participants */}
      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Participants</h3>
        {conversation.participants?.map((p, i) => (
          <div key={p._id || i} className="flex items-center gap-2">
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white',
              i === 0 ? 'bg-blue-500' : 'bg-gray-500'
            )}>
              {p.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{p.name || 'Unknown'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2 flex-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</h3>
        {ACTION_LIST.map(action => {
          const Icon = action.icon;
          const isLoading = activeAction === action.key;
          return (
            <button
              key={action.key}
              onClick={() => handleAction(action)}
              disabled={loading || !!activeAction}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all',
                VARIANT_CLASSES[action.variant],
                (loading || activeAction) && !isLoading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                : <Icon className="h-4 w-4 shrink-0" />
              }
              <div className="min-w-0">
                <div>{action.label}</div>
                <div className="text-[10px] opacity-75 font-normal">{action.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
