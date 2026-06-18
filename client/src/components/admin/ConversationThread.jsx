import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Flag, ExternalLink } from 'lucide-react';

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

function MessageBubble({ msg, participantIds }) {
  const isOwner = participantIds?.[0] === msg.sender?._id;
  const isFlagged = msg.isFlagged;

  return (
    <div className={cn('flex gap-2 mb-3', isOwner ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
        isOwner ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-foreground'
      )}>
        {msg.sender?.name?.charAt(0)?.toUpperCase() || '?'}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[70%] group',
        isFlagged && 'border-l-[3px] border-amber-500 pl-2 -ml-2'
      )}>
        <div className={cn(
          'px-3 py-2 rounded-2xl text-sm leading-relaxed break-words',
          isOwner
            ? 'bg-blue-500 text-white rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm',
          msg.isDeleted && 'opacity-50 italic'
        )}>
          {msg.isDeleted ? (
            <span className="text-xs">This message was deleted</span>
          ) : (
            msg.text || <span className="opacity-60 text-xs">[{msg.type || 'message'}]</span>
          )}
          {isFlagged && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-500">
              <Flag className="h-3 w-3" /> Flagged
            </span>
          )}
        </div>
        <p className={cn(
          'text-[10px] text-muted-foreground mt-0.5 px-1',
          isOwner ? 'text-right' : 'text-left'
        )}>
          {msg.sender?.name} · {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function ConversationThread({ conversation, messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="font-semibold text-foreground mb-1">Select a conversation</h3>
        <p className="text-sm text-muted-foreground">Choose a conversation from the left to view messages</p>
      </div>
    );
  }

  const participantIds = conversation?.participants?.map(p => p._id) || [];
  const p1 = conversation?.participants?.[0];
  const p2 = conversation?.participants?.[1];

  return (
    <div className="flex flex-col h-full">
      {/* Participant info bar */}
      {conversation && (
        <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-3 shrink-0">
          <div className="flex -space-x-2">
            {[p1, p2].filter(Boolean).map((p, i) => (
              <div key={i} className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-background',
                i === 0 ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'
              )}>
                {p.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {p1?.name || 'Unknown'} ↔ {p2?.name || 'Unknown'}
            </p>
            {conversation.property?.title && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                Re: {conversation.property.title}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </p>
            )}
          </div>
          <div className="text-xs text-muted-foreground shrink-0">
            {messages.length} messages
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn('flex gap-2 mb-3', i % 2 ? 'flex-row-reverse' : 'flex-row')}>
              <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
              <div className={cn('rounded-2xl h-10 bg-muted animate-pulse', i % 2 ? 'w-40 ml-auto' : 'w-52')} />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No messages in this conversation</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              participantIds={participantIds}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
