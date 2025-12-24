import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { MessageSquare, AlertCircle } from "lucide-react";

export function ChatWindow({
    conversation,
    currentUserId,
    onSendMessage,
    onDeleteConversation,
    sending = false,
}) {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [sendError, setSendError] = useState(null);
    const [previousMessageCount, setPreviousMessageCount] = useState(0);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

    const scrollToBottom = (behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    // Check if user is near bottom of chat
    const isNearBottom = () => {
        if (!messagesContainerRef.current) return true;
        
        const container = messagesContainerRef.current;
        const threshold = 100; // pixels from bottom
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    };

    // Handle scroll events to detect if user manually scrolled up
    const handleScroll = () => {
        const nearBottom = isNearBottom();
        setShouldAutoScroll(nearBottom);
    };

    // Initialize shouldAutoScroll based on initial scroll position
    useEffect(() => {
        // Small delay to ensure the component is fully rendered
        const timer = setTimeout(() => {
            setShouldAutoScroll(isNearBottom());
        }, 100);
        
        return () => clearTimeout(timer);
    }, [conversation.id]);

    // Smart auto-scroll logic - only for new messages, not conversation switches
    useEffect(() => {
        const messageCount = conversation.messages?.length || 0;
        
        // Only auto-scroll if new messages were added and user is near bottom
        if (messageCount > previousMessageCount && previousMessageCount > 0 && shouldAutoScroll) {
            scrollToBottom();
        }
        
        setPreviousMessageCount(messageCount);
    }, [conversation.messages, shouldAutoScroll, previousMessageCount]);

    // Reset message count when conversation changes, but don't auto-scroll
    useEffect(() => {
        const messageCount = conversation.messages?.length || 0;
        setPreviousMessageCount(messageCount);
        // Don't reset shouldAutoScroll - let user's scroll position determine this
    }, [conversation.id]);

    // Clear send error after 5 seconds
    useEffect(() => {
        if (sendError) {
            const timeout = setTimeout(() => setSendError(null), 5000);
            return () => clearTimeout(timeout);
        }
    }, [sendError]);

    const participant = conversation.participants[0];

    // Handle message send with error handling
    const handleSendMessage = async (messageText, file = null) => {
        setSendError(null);
        
        // Ensure auto-scroll when user sends a message
        setShouldAutoScroll(true);
        
        try {
            const result = await onSendMessage(messageText, file);
            
            // Check if the result indicates a failure
            if (result && result.success === false) {
                setSendError(result.error?.message || 'Failed to send message');
                return result;
            }
            
            return result;
        } catch (error) {
            setSendError(error.message || 'Failed to send message');
            throw error;
        }
    };

    return (
        <div className="flex flex-col h-full bg-card rounded-r-xl overflow-hidden min-w-0">
            <ChatHeader participant={participant} onDeleteConversation={onDeleteConversation} />

            {/* Send Error Banner */}
            {sendError && (
                <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{sendError}</span>
                    <button 
                        onClick={() => setSendError(null)}
                        className="ml-auto text-xs hover:underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-2 bg-muted/30 min-w-0"
            >
                {!conversation.messages || conversation.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="font-medium text-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground">
                            Start the conversation by typing below
                        </p>
                    </div>
                ) : (
                    <div>
                        {conversation.messages.map((message, index) => (
                            <MessageBubble
                                key={message.id || message._id || `message-${index}-${message.timestamp || Date.now()}`}
                                message={message}
                                isOwn={message.senderId === currentUserId || message.sender === currentUserId}
                                isPending={message.pending}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Composer */}
            <MessageComposer onSendMessage={handleSendMessage} disabled={sending} />
        </div>
    );
}
