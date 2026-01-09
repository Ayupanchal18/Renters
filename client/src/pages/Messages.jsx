import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ConversationList } from "../components/chatComponents/ConversationList";
import { ChatWindow } from "../components/chatComponents/ChatWindow.jsx";
import { EmptyChatState } from "../components/chatComponents/EmptyChatState.jsx";
import { ChevronLeft, AlertCircle, RefreshCw } from "lucide-react";
import Navbar from './../components/Navbar';
import { useMessages } from "../hooks/useMessages";
import { getUser } from "../utils/auth";

export default function Messages() {
    const [showMobileChat, setShowMobileChat] = useState(false);
    const location = useLocation();
    
    // Get current user
    const user = getUser();
    const currentUserId = user?._id || user?.id || "current-user";

    // Use the useMessages hook for real data and socket connection
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
        setError
    } = useMessages({ autoConnect: true });

    // Auto-select conversation if passed via navigation state
    const hasAutoSelectedRef = useRef(false);
    
    useEffect(() => {
        const conversationId = location.state?.conversationId;
        
        // Only auto-select once per navigation, and only if we have conversations loaded
        if (conversationId && conversations.length > 0 && !hasAutoSelectedRef.current) {
            hasAutoSelectedRef.current = true;
            
            const targetConversation = conversations.find(
                conv => (conv._id || conv.id) === conversationId
            );
            if (targetConversation) {
                handleSelectConversation(targetConversation);
            } else {
                // If not in list yet, select by ID directly
                selectConversation(conversationId);
                setShowMobileChat(true);
            }
        }
        
        // Reset the ref when conversationId changes (new navigation)
        if (!conversationId) {
            hasAutoSelectedRef.current = false;
        }
    }, [location.state?.conversationId, conversations.length, selectConversation]);

    // Handle selecting a conversation
    const handleSelectConversation = async (conversation) => {
        await selectConversation(conversation);
        setShowMobileChat(true);
        
        // Mark messages as read when opening conversation
        const conversationId = conversation._id || conversation.id;
        if (conversationId) {
            await markAsRead(conversationId);
        }
    };

    // Handle sending a message
    const handleSendMessage = async (messageText, file = null) => {
        if (!selectedConversation || (!messageText.trim() && !file)) return;
        
        const result = await sendMessage(messageText, file);
        
        if (!result.success) {
            console.error("Failed to send message:", result.error);
        }
        
        return result;
    };

    // Handle retry on error
    const handleRetry = () => {
        setError(null);
        fetchConversations();
    };

    // Handle delete conversation
    const handleDeleteConversation = async () => {
        if (!selectedConversation) return;
        
        const conversationId = selectedConversation._id || selectedConversation.id;
        const result = await deleteConversation(conversationId);
        
        if (result.success) {
            setShowMobileChat(false);
        } else {
            setError(result.error || 'Failed to delete conversation');
        }
    };

    // Transform conversation data for components that expect the old format
    const transformConversationForUI = useCallback((conv) => {
        if (!conv) return null;
        
        const convId = conv._id || conv.id;
        
        // Get participant info (the other user in the conversation)
        const participants = conv.participants?.map(p => {
            // Handle both populated and non-populated participant data
            if (typeof p === 'object') {
                return {
                    id: p._id || p.id,
                    name: p.name || p.fullName || 'Unknown User',
                    email: p.email || '',
                    phone: p.phone || p.phoneNumber || null,
                    avatar: p.avatar || p.profileImage || null,
                    isOnline: p.isOnline || false
                };
            }
            // If participant is just an ID string
            return {
                id: p,
                name: 'User',
                email: '',
                avatar: null, // Remove external avatar service
                isOnline: false
            };
        }).filter(p => p.id !== currentUserId) || [];

        // Transform messages to expected format
        // For selected conversation, use messages from hook state, otherwise use conv.messages
        const messagesToTransform = conv._id === selectedConversation?._id ? messages : (conv.messages || []);
        
        const transformedMessages = messagesToTransform.map(msg => {
            // If message is already transformed (has all required fields), return as-is
            if (msg.text !== undefined && msg.senderId !== undefined && msg.id !== undefined) {
                return msg;
            }
            
            // Otherwise, transform it
            const transformed = {
                id: msg._id || msg.id,
                senderId: msg.sender?._id || msg.sender?.id || msg.sender,
                senderName: msg.sender?.name || (msg.sender === currentUserId ? 'You' : 'User'),
                senderAvatar: msg.sender?.avatar || null, // Remove external avatar service
                text: msg.text || msg.content || '',
                image: msg.image,
                timestamp: msg.createdAt || msg.timestamp,
                read: msg.read || false,
                pending: msg.pending || false
            };
            return transformed;
        });

        // Get unread count for current user
        let unreadCount = 0;
        if (conv.unreadCount) {
            if (typeof conv.unreadCount === 'object') {
                unreadCount = conv.unreadCount[currentUserId] || 0;
            } else if (typeof conv.unreadCount === 'number') {
                unreadCount = conv.unreadCount;
            }
        }

        return {
            id: convId,
            _id: convId,
            participants: participants.length > 0 ? participants : [{
                id: 'unknown',
                name: 'Unknown User',
                email: '',
                avatar: null, // Remove external avatar service
                isOnline: false
            }],
            lastMessage: conv.lastMessage ? {
                id: conv.lastMessage._id || conv.lastMessage.id,
                senderId: conv.lastMessage.sender?._id || conv.lastMessage.sender?.id || conv.lastMessage.sender,
                senderName: conv.lastMessage.sender?.name || 'User',
                text: conv.lastMessage.text || '',
                timestamp: conv.lastMessage.createdAt || conv.lastMessage.timestamp
            } : null,
            lastMessageTime: conv.lastActivityAt || conv.lastMessage?.createdAt || conv.updatedAt,
            unreadCount,
            messages: transformedMessages,
            property: conv.property
        };
    }, [currentUserId, selectedConversation, messages]); // Add dependencies to prevent infinite loops

    // Transform all conversations for the list
    const transformedConversations = useMemo(() => 
        conversations.map(transformConversationForUI).filter(Boolean),
        [conversations, transformConversationForUI]
    );
    
    // Transform selected conversation
    const transformedSelectedConversation = useMemo(() => 
        selectedConversation 
            ? transformConversationForUI({
                ...selectedConversation,
                messages: messages // Use messages from hook state
            })
            : null,
        [selectedConversation, messages, transformConversationForUI]
    );

    return (
        <>
            <Navbar />
            <div className="h-[calc(100dvh-64px)] sm:h-[calc(100dvh-72px)] bg-background flex flex-col overflow-hidden">
                {/* Mobile header - only show when in chat view */}
                {showMobileChat && transformedSelectedConversation && (
                    <div className="md:hidden bg-card border-b border-border px-4 py-3 flex items-center rounded-t-xl mx-4 mt-4">
                        <button
                            onClick={() => setShowMobileChat(false)}
                            className="mr-3 p-1 text-foreground hover:text-primary transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-bold text-foreground">
                            {transformedSelectedConversation.participants[0]?.name}
                        </h1>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mx-4 mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Layout */}
                <div className="flex flex-1 overflow-hidden p-2 sm:p-4 md:p-5 gap-0 min-h-0">
                    {/* Left panel - Conversation List */}
                    <div
                        className={`w-full md:w-[380px] lg:w-[420px] md:rounded-l-xl bg-card border md:border-r-0 border-border flex flex-col rounded-xl md:rounded-r-none shadow-sm overflow-hidden ${showMobileChat ? "hidden md:flex" : "flex"
                            }`}
                    >
                        <ConversationList
                            conversations={transformedConversations}
                            selectedConversationId={transformedSelectedConversation?.id}
                            onSelectConversation={handleSelectConversation}
                            loading={conversationsLoading}
                        />
                    </div>

                    {/* Right panel - Chat Window */}
                    <div
                        className={`flex-1 flex md:rounded-r-xl flex-col border md:border-l-0 border-border rounded-xl md:rounded-l-none shadow-sm overflow-hidden min-w-0 ${showMobileChat ? "flex" : "hidden md:flex"
                            }`}
                    >
                        {messagesLoading ? (
                            <div className="flex-1 flex items-center justify-center bg-card rounded-r-xl">
                                <div className="text-center text-muted-foreground">
                                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                                    <p>Loading messages...</p>
                                </div>
                            </div>
                        ) : transformedSelectedConversation ? (
                            <ChatWindow
                                conversation={transformedSelectedConversation}
                                currentUserId={currentUserId}
                                onSendMessage={handleSendMessage}
                                onDeleteConversation={handleDeleteConversation}
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
