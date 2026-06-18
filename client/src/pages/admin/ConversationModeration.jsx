import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Flag } from 'lucide-react';
import ConversationList from '../../components/admin/ConversationList';
import ConversationThread from '../../components/admin/ConversationThread';
import ConversationActions from '../../components/admin/ConversationActions';
import FlagModal from '../../components/admin/FlagModal';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { useSnackbar } from '../../context/SnackbarContext';
import { cn } from '../../lib/utils';

const JUSTIFICATION = 'Admin moderation review';

export default function ConversationModeration() {
  const navigate = useNavigate();
  const { showUndo } = useSnackbar();

  // Selected conversation
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);

  // Flag modal
  const [flagOpen, setFlagOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadThread = useCallback(async (conv) => {
    setSelectedConv(conv);
    setMessages([]);
    setThreadLoading(true);
    try {
      const res = await authenticatedFetch(
        `/api/admin/messages/conversations/${conv._id}?justification=${encodeURIComponent(JUSTIFICATION)}`,
        { headers: getHeaders() },
        navigate
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages || []);
        setSelectedConv(data.data.conversation);
      }
    } catch (e) {
      console.error('Thread load error:', e);
    } finally {
      setThreadLoading(false);
    }
  }, [navigate]);

  const handleAction = useCallback(async (actionKey, payload) => {
    const id = payload?.conversationId;
    if (!id) return;

    setActionLoading(true);
    try {
      switch (actionKey) {
        case 'flag':
          setFlagOpen(true);
          break;

        case 'escalate': {
          const res = await authenticatedFetch(
            `/api/admin/messages/conversations/${id}/escalate`,
            { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({}) },
            navigate
          );
          const data = await res.json();
          if (data.success) {
            setRefreshTrigger(t => t + 1);
            showUndo({ message: 'Conversation escalated to senior admin' });
          }
          break;
        }

        case 'resolve': {
          const res = await authenticatedFetch(
            `/api/admin/messages/conversations/${id}/resolve`,
            { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ resolution: 'Resolved by admin' }) },
            navigate
          );
          const data = await res.json();
          if (data.success) {
            setRefreshTrigger(t => t + 1);
            showUndo({ message: 'Conversation marked as resolved' });
          }
          break;
        }

        case 'warn': {
          const res = await authenticatedFetch(
            `/api/admin/messages/conversations/${id}/warn`,
            { method: 'POST', headers: getHeaders(), body: JSON.stringify({}) },
            navigate
          );
          if (res.ok) showUndo({ message: 'Warning sent to participants' });
          break;
        }

        case 'export': {
          const res = await authenticatedFetch(
            `/api/admin/messages/conversations/${id}/export`,
            { method: 'GET', headers: getHeaders() },
            navigate
          );
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `conversation-${id}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
          break;
        }

        case 'block-participant': {
          navigate('/admin/users');
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('Action error:', e);
    } finally {
      if (actionKey !== 'flag') setActionLoading(false);
    }
  }, [navigate, showUndo]);

  const handleFlagSubmit = useCallback(async (severity, reason) => {
    const id = selectedConv?._id;
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await authenticatedFetch(
        `/api/admin/messages/conversations/${id}/flag`,
        { method: 'POST', headers: getHeaders(), body: JSON.stringify({ severity, reason }) },
        navigate
      );
      const data = await res.json();
      if (data.success) {
        setRefreshTrigger(t => t + 1);
        showUndo({ message: `Conversation flagged as ${severity}` });
      }
    } catch (e) {
      console.error('Flag error:', e);
    } finally {
      setActionLoading(false);
    }
  }, [selectedConv, navigate, showUndo]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem-4rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Conversation Moderation
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor, flag, and moderate user conversations
          </p>
        </div>
        {selectedConv?.flagStatus && selectedConv.flagStatus !== 'none' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
            <Flag className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-400 font-medium capitalize">
              {selectedConv.flagStatus}
            </span>
          </div>
        )}
      </div>

      {/* Split panel layout */}
      <div className="flex flex-1 rounded-2xl border border-border overflow-hidden bg-background min-h-0">
        {/* Left: Conversation list — 38% */}
        <div className="w-[38%] border-r border-border flex flex-col min-h-0">
          <ConversationList
            onSelect={loadThread}
            selectedId={selectedConv?._id}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Center: Thread reader — 40% */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-border">
          <ConversationThread
            conversation={selectedConv}
            messages={messages}
            loading={threadLoading}
          />
        </div>

        {/* Right: Action panel — 22% */}
        <div className="w-[22%] min-w-[200px] flex flex-col min-h-0 overflow-y-auto">
          <ConversationActions
            conversation={selectedConv}
            onAction={handleAction}
            loading={actionLoading}
          />
        </div>
      </div>

      {/* Flag modal */}
      <FlagModal
        open={flagOpen}
        onOpenChange={(v) => { setFlagOpen(v); if (!v) setActionLoading(false); }}
        onSubmit={handleFlagSubmit}
        loading={actionLoading}
      />
    </div>
  );
}
