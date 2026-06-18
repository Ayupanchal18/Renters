import { useState, useMemo } from "react";
import { Search, MessageSquare, RefreshCw } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

// Format helper for conversation timestamps
function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Initials fallback generator
function getAvatarFallback(name) {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function ConversationList({
    conversations,
    selectedConversationId,
    onSelectConversation,
    loading = false,
    onRefresh,
}) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter conversations based on search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) {
            return conversations;
        }

        const query = searchQuery.toLowerCase();
        return conversations.filter(conv => {
            const participantMatch = conv.participants?.some(p => 
                p.name?.toLowerCase().includes(query)
            );
            const messageMatch = conv.lastMessage?.text?.toLowerCase().includes(query);
            return participantMatch || messageMatch;
        });
    }, [conversations, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-card border-r border-border overflow-hidden">
            {/* Search and Header Header */}
            <div className="px-4 py-4 border-b border-border space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Messages</h1>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors active:scale-95"
                            title="Refresh conversations"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-9 text-sm"
                    />
                </div>
            </div>

            {/* Scrollable Conversation Items */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-muted-foreground">Loading conversations...</p>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm font-semibold text-foreground">
                            {searchQuery ? "No results found" : "No conversations yet"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                            {searchQuery 
                                ? "Try a different search term" 
                                : "Browse properties to start a conversation"}
                        </p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredConversations.map((conversation) => {
                            const convId = conversation.id || conversation._id;
                            const isSelected = selectedConversationId === convId;
                            const participant = conversation.participants?.[0] || {
                                name: "Unknown User",
                                avatar: null,
                                isOnline: false,
                            };
                            
                            const lastMessageText = conversation.lastMessage?.text || "No messages yet";
                            const messageTime = conversation.lastMessageTime || 
                                               conversation.lastActivityAt || 
                                               conversation.lastMessage?.createdAt;

                            return (
                                <button
                                    key={convId}
                                    onClick={() => onSelectConversation(conversation)}
                                    className={cn(
                                        "w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 relative flex items-center gap-3",
                                        "hover:scale-[1.01] hover:-translate-y-[0.5px] hover:shadow-sm hover:bg-muted/40",
                                        isSelected 
                                            ? "border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10 rounded-l-none" 
                                            : "border-l-4 border-l-transparent"
                                    )}
                                >
                                    {/* Avatar & Online status indicator dot */}
                                    <div className="relative flex-shrink-0">
                                        {participant.avatar ? (
                                            <img
                                                src={participant.avatar}
                                                alt={participant.name}
                                                className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                                                referrerPolicy="no-referrer"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 ring-2 ring-border flex items-center justify-center">
                                                <span className="text-xs font-bold text-primary">
                                                    {getAvatarFallback(participant.name)}
                                                </span>
                                            </div>
                                        )}
                                        {participant.isOnline && (
                                            <span 
                                                className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-card" 
                                                aria-label="Online"
                                            />
                                        )}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <h3 className={cn(
                                                "text-sm font-semibold text-foreground truncate",
                                                conversation.unreadCount > 0 && "font-extrabold"
                                            )}>
                                                {participant.name}
                                            </h3>
                                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                {formatTime(messageTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn(
                                                "text-xs truncate flex-1",
                                                conversation.unreadCount > 0 
                                                    ? "text-foreground font-semibold" 
                                                    : "text-muted-foreground"
                                            )}>
                                                {lastMessageText}
                                            </p>
                                            {conversation.unreadCount > 0 && (
                                                <span className="w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                                                    {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
