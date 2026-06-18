import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import {
  MessageSquare, Search, Flag, AlertTriangle,
  CheckCircle2, Clock, User2, Building2,
  ChevronRight, Filter, RefreshCw
} from 'lucide-react';

const FLAG_COLORS = {
  none: '',
  low: 'border-l-4 border-l-yellow-400',
  medium: 'border-l-4 border-l-orange-500',
  high: 'border-l-4 border-l-red-600',
  escalated: 'border-l-4 border-l-purple-600',
  resolved: 'border-l-4 border-l-emerald-500',
};

const FLAG_BADGE = {
  none: { label: 'Clean', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  low: { label: 'Low', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  medium: { label: 'Medium', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  high: { label: 'High', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  escalated: { label: 'Escalated', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  resolved: { label: 'Resolved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

function formatRelative(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ConversationItem({ conv, isSelected, onClick }) {
  const flag = conv.flagStatus || 'none';
  const fb = FLAG_BADGE[flag] || FLAG_BADGE.none;
  const p1 = conv.participants?.[0];
  const p2 = conv.participants?.[1];

  return (
    <button
      onClick={() => onClick(conv)}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-border transition-colors',
        FLAG_COLORS[flag],
        isSelected ? 'bg-primary/8 dark:bg-primary/10' : 'hover:bg-muted/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-sm font-medium truncate">
              {p1?.name || 'Unknown'} ↔ {p2?.name || 'Unknown'}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatRelative(conv.lastActivityAt)}
            </span>
          </div>
          {conv.property?.title && (
            <p className="text-xs text-muted-foreground truncate mb-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {conv.property.title}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {conv.messageCount || 0} messages
            </span>
            <Badge className={cn('text-[10px] py-0 px-1.5', fb.className)}>{fb.label}</Badge>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ConversationList({
  onSelect,
  selectedId,
  refreshTrigger
}) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [flagFilter, setFlagFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchConversations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, sortBy: 'lastActivityAt', sortOrder: 'desc' });
      if (search) params.append('search', search);
      if (flagFilter !== 'all') params.append('flagStatus', flagFilter);

      const res = await authenticatedFetch(
        `/api/admin/messages/conversations?${params}`,
        { headers: getHeaders() },
        navigate
      );
      const data = await res.json();
      if (data.success) {
        setConversations(data.data.conversations || []);
        setPagination(data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (e) {
      console.error('ConversationList fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [navigate, search, flagFilter]);

  useEffect(() => { fetchConversations(1); }, [fetchConversations, refreshTrigger]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search participants..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['all', 'none', 'low', 'medium', 'high', 'escalated'].map(f => (
            <button
              key={f}
              onClick={() => setFlagFilter(f)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors',
                flagFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}
            >
              {f === 'all' ? 'All' : FLAG_BADGE[f]?.label || f}
            </button>
          ))}
          <button onClick={() => fetchConversations(1)} className="ml-auto text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">{pagination.total} conversations</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-border">
              <div className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm font-medium">No conversations found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          conversations.map(conv => (
            <ConversationItem
              key={conv._id}
              conv={conv}
              isSelected={selectedId === conv._id}
              onClick={onSelect}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border">
          <Button size="sm" variant="ghost" disabled={pagination.page <= 1} onClick={() => fetchConversations(pagination.page - 1)}>
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button size="sm" variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchConversations(pagination.page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
