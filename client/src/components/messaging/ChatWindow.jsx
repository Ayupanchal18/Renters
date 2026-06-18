import { useState } from "react";
import { Phone, MoreVertical, Trash2, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { MessageThread } from "./MessageThread";
import { MessageComposer } from "./MessageComposer";
import { useSocketConnected } from "../../contexts/SocketContext";
import { cn } from "../../lib/utils";

// Format helper for last-seen indicator
function formatLastSeen(lastActivityAt) {
    if (!lastActivityAt) return "Offline";
    const date = new Date(lastActivityAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return "Online just now";
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return `Last seen on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// Avatar initials fallback
function getAvatarFallback(name) {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function ChatWindow({
    conversation,
    currentUserId,
    onSendMessage,
    onDeleteConversation,
    onBackToList,
    isRecipientTyping = false,
    onTypingChange,
    sending = false,
}) {
    const [showMenu, setShowMenu] = useState(false);
    const isSocketConnected = useSocketConnected();
    
    const participant = conversation.participants?.[0] || {
        name: "User",
        avatar: null,
        isOnline: false,
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
            onDeleteConversation?.();
        }
        setShowMenu(false);
    };

    // Pre-populate files dragged onto composer
    const handleFileDropped = (file) => {
        // Send dropped files directly through send message logic
        onSendMessage("", file);
    };

    return (
        <div className="flex flex-col h-full bg-card overflow-hidden min-w-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Mobile Back Button */}
                    <button
                        onClick={onBackToList}
                        className="md:hidden -ml-1 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Back to conversation list"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        {participant.avatar ? (
                            <img
                                src={participant.avatar}
                                alt={participant.name}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-border"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 ring-2 ring-border flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">
                                    {getAvatarFallback(participant.name)}
                                </span>
                            </div>
                        )}
                        {participant.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-card" />
                        )}
                    </div>

                    {/* Participant Info */}
                    <div className="min-w-0">
                        <h2 className="font-semibold text-foreground text-sm truncate leading-tight">
                            {participant.name}
                        </h2>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {participant.isOnline ? (
                                <span className="text-success font-semibold">Online</span>
                            ) : (
                                <span>{formatLastSeen(participant.lastActivityAt)}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Call / Settings Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {participant.phone ? (
                        <a 
                            href={`tel:${participant.phone}`}
                            className="inline-flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl transition-colors"
                            title={`Call ${participant.name}`}
                        >
                            <Phone className="w-4 h-4" />
                        </a>
                    ) : (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground/30 cursor-not-allowed h-9 w-9 rounded-xl"
                            disabled
                            title="Phone number not available"
                        >
                            <Phone className="w-4 h-4" />
                        </Button>
                    )}

                    <div className="relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                                "text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl active:scale-95",
                                showMenu && "bg-muted"
                            )}
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                        
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-destructive hover:bg-destructive/10 w-full text-left transition-colors font-semibold"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete Conversation
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Offline Socket Warning Banner */}
            {!isSocketConnected && (
                <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center gap-2 text-warning-foreground text-xs flex-shrink-0 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 animate-pulse" />
                    <span className="font-semibold">Connection lost — reconnecting...</span>
                </div>
            )}

            {/* Messages Thread list */}
            <MessageThread
                messages={conversation.messages}
                currentUserId={currentUserId}
                isRecipientTyping={isRecipientTyping}
                onFileSelect={handleFileDropped}
            />

            {/* Composer */}
            <div className="flex-shrink-0">
                <MessageComposer 
                    onSendMessage={onSendMessage} 
                    disabled={sending} 
                    onTypingChange={onTypingChange}
                />
            </div>
        </div>
    );
}
