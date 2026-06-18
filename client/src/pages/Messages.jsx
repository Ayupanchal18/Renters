import { useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConversationList } from "../components/messaging/ConversationList";
import { ChatWindow } from "../components/messaging/ChatWindow";
import { EmptyChatState } from "../components/messaging/EmptyChatState";
import { AlertCircle, RefreshCw } from "lucide-react";
import Navbar from "./../components/Navbar";
import { useMessages } from "../hooks/useMessages";
import { getUser } from "../utils/auth";
import { cn } from "../lib/utils";

// Loader skeleton for conversations
function ConversationListSkeleton() {
    return (
        <div className="p-3 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                    <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0 animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                        <div className="h-2.5 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Loader skeleton for messages
function MessageThreadSkeleton() {
    return (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {[1, 2, 3, 4].map((i) => {
                const isRight = i % 2 === 0;
                return (
                    <div key={i} className={cn("flex w-full", isRight ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[70%] px-4 py-3 rounded-2xl animate-pulse space-y-2",
                            isRight ? "bg-primary/10 rounded-tr-none" : "bg-muted rounded-tl-none"
                        )}>
                            <div className="h-3 bg-muted-foreground/15 rounded w-24 sm:w-40" />
                            <div className="h-2.5 bg-muted-foreground/10 rounded w-16" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function Messages() {
    const navigate = useNavigate();
    const { conversationId } = useParams();

    // Get current user info
    const user = getUser();
    const currentUserId = user?._id || user?.id || "current-user";

    // useMessages hook for logic and socket subscriptions
    const {
        conversations,
        selectedConversation,
        messages,
        conversationsLoading,
        messagesLoading,
        sending,
        error,
        selectConversation,
        sendMessage,
        markAsRead,
        deleteConversation,
        fetchConversations,
        sendTypingIndicator,
        isRecipientTyping,
        setError,
    } = useMessages({ autoFetch: true });

    // Mark messages as read when opening conversation or new messages arrive
    useEffect(() => {
        if (conversationId) {
            markAsRead(conversationId);
        }
    }, [conversationId, messages.length, markAsRead]);

    // Synchronize URL param with selected conversation state
    useEffect(() => {
        if (conversationId) {
            const selectedId = selectedConversation?._id || selectedConversation?.id;
            if (selectedId !== conversationId) {
                const found = conversations.find(
                    c => (c._id || c.id) === conversationId
                );
                if (found) {
                    selectConversation(found);
                } else {
                    selectConversation(conversationId);
                }
            }
        } else if (selectedConversation) {
            // If URL does not have param, clear selected conversation
            selectConversation(null);
        }
    }, [conversationId, conversations, selectConversation, selectedConversation]);

    // Handle user selecting a conversation
    const handleSelectConversation = (conversation) => {
        const id = conversation._id || conversation.id;
        navigate(`/messages/${id}`);
    };

    // Handle back action on mobile
    const handleBackToList = () => {
        navigate("/messages");
    };

    // Send a message in active thread
    const handleSendMessage = async (messageText, file = null) => {
        if (!selectedConversation) return;
        const result = await sendMessage(messageText, file);
        return result;
    };

    // Retry fetching when failing
    const handleRetry = () => {
        setError(null);
        fetchConversations();
    };

    // Soft delete conversation
    const handleDeleteConversation = async () => {
        if (!selectedConversation) return;
        const id = selectedConversation._id || selectedConversation.id;
        const result = await deleteConversation(id);
        if (result.success) {
            navigate("/messages");
        } else {
            setError(result.error || "Failed to delete conversation");
        }
    };

    // Typing activity trigger callback
    const handleTypingChange = (isTyping) => {
        sendTypingIndicator(isTyping);
    };

    // Normalize conversations for UI
    const transformConversationForUI = useCallback((conv) => {
        if (!conv) return null;
        
        const convId = conv._id || conv.id;
        
        // Filter out current user from participants list
        const participants = conv.participants?.map(p => {
            if (typeof p === "object") {
                return {
                    id: p._id || p.id,
                    name: p.name || p.fullName || "User",
                    email: p.email || "",
                    phone: p.phone || p.phoneNumber || null,
                    avatar: p.avatar || null,
                    isOnline: p.isOnline || false,
                    lastActivityAt: p.lastActivityAt || null
                };
            }
            return {
                id: p,
                name: "User",
                email: "",
                avatar: null,
                isOnline: false,
                lastActivityAt: null
            };
        }).filter(p => p.id !== currentUserId) || [];

        const messagesToTransform = conv._id === selectedConversation?._id ? messages : (conv.messages || []);
        
        const transformedMessages = messagesToTransform.map(msg => {
            if (msg.text !== undefined && msg.senderId !== undefined && msg.id !== undefined) {
                return msg;
            }
            return {
                id: msg._id || msg.id,
                senderId: msg.sender?._id || msg.sender?.id || msg.sender,
                senderName: msg.sender?.name || (msg.sender === currentUserId ? "You" : "User"),
                senderAvatar: msg.sender?.avatar || null,
                text: msg.text || msg.content || "",
                image: msg.image,
                attachment: msg.attachment,
                file: msg.file,
                timestamp: msg.createdAt || msg.timestamp,
                read: msg.read || false,
                pending: msg.pending || false
            };
        });

        let unreadCount = 0;
        if (conv.unreadCount) {
            if (typeof conv.unreadCount === "object") {
                unreadCount = conv.unreadCount[currentUserId] || 0;
            } else if (typeof conv.unreadCount === "number") {
                unreadCount = conv.unreadCount;
            }
        }

        return {
            id: convId,
            _id: convId,
            participants: participants.length > 0 ? participants : [{
                id: "unknown",
                name: "User",
                email: "",
                avatar: null,
                isOnline: false,
                lastActivityAt: null
            }],
            lastMessage: conv.lastMessage ? {
                id: conv.lastMessage._id || conv.lastMessage.id,
                senderId: conv.lastMessage.sender?._id || conv.lastMessage.sender?.id || conv.lastMessage.sender,
                senderName: conv.lastMessage.sender?.name || "User",
                text: conv.lastMessage.text || "",
                timestamp: conv.lastMessage.createdAt || conv.lastMessage.timestamp
            } : null,
            lastMessageTime: conv.lastActivityAt || conv.lastMessage?.createdAt || conv.updatedAt,
            unreadCount,
            messages: transformedMessages,
            property: conv.property
        };
    }, [currentUserId, selectedConversation, messages]);

    const transformedConversations = useMemo(() => 
        conversations.map(transformConversationForUI).filter(Boolean),
        [conversations, transformConversationForUI]
    );
    
    const transformedSelectedConversation = useMemo(() => 
        selectedConversation 
            ? transformConversationForUI({
                ...selectedConversation,
                messages: messages
            })
            : null,
        [selectedConversation, messages, transformConversationForUI]
    );

    return (
        <>
            <Navbar />
            <div className="h-[calc(100dvh-64px)] sm:h-[calc(100dvh-72px)] bg-background flex flex-col overflow-hidden">
                {/* Error Banner */}
                {error && (
                    <div className="mx-4 mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between flex-shrink-0 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-xs font-semibold">{error}</span>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-1 text-xs text-destructive hover:opacity-80 transition-colors font-bold"
                        >
                            <RefreshCw className="w-4.5 h-4.5" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Main responsive chat split layout */}
                <div className="flex flex-1 overflow-hidden p-2 sm:p-4 md:p-5 gap-0 min-h-0">
                    {/* Left Pane - Conversations List */}
                    <div
                        className={cn(
                            "w-full md:w-[320px] lg:w-[360px] md:rounded-l-2xl border md:border-r-0 border-border flex flex-col bg-card shadow-sm overflow-hidden flex-shrink-0",
                            conversationId ? "hidden md:flex" : "flex"
                        )}
                    >
                        {conversationsLoading ? (
                            <ConversationListSkeleton />
                        ) : (
                            <ConversationList
                                conversations={transformedConversations}
                                selectedConversationId={transformedSelectedConversation?.id}
                                onSelectConversation={handleSelectConversation}
                            />
                        )}
                    </div>

                    {/* Right Pane - Chat Window / Thread details */}
                    <div
                        className={cn(
                            "flex-1 flex md:rounded-r-2xl flex-col border border-border bg-card shadow-sm overflow-hidden min-w-0",
                            conversationId ? "flex" : "hidden md:flex"
                        )}
                    >
                        {messagesLoading ? (
                            <div className="flex flex-col h-full">
                                <div className="h-14 border-b border-border bg-card animate-pulse" />
                                <MessageThreadSkeleton />
                                <div className="h-16 border-t border-border bg-card animate-pulse" />
                            </div>
                        ) : transformedSelectedConversation ? (
                            <ChatWindow
                                conversation={transformedSelectedConversation}
                                currentUserId={currentUserId}
                                onSendMessage={handleSendMessage}
                                onDeleteConversation={handleDeleteConversation}
                                onBackToList={handleBackToList}
                                isRecipientTyping={isRecipientTyping}
                                onTypingChange={handleTypingChange}
                                sending={sending}
                            />
                        ) : (
                            <EmptyChatState />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
