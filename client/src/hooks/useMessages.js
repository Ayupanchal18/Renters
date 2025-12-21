/**
 * useMessages Hook - Manages messaging state and real-time updates
 * Requirements: 2.1, 3.1, 4.1
 * 
 * Provides:
 * - Conversations list state management
 * - Selected conversation and messages management
 * - Real-time message updates via socket
 * - sendMessage, markAsRead functions
 * - Loading and error state tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import messageService from '../api/messageService';
import {
    getSocket,
    onMessageReceived,
    onMessageReadUpdate,
    joinConversation as socketJoinConversation,
    leaveConversation as socketLeaveConversation,
    sendTypingStart,
    sendTypingStop
} from '../lib/socket';
import { getUser, isAuthenticated } from '../utils/auth';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Utility function to retry an async operation
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 */
const retryOperation = async (operation, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (attempt < maxRetries) {
                // Wait before retrying with exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
            }
        }
    }

    throw lastError;
};

/**
 * Hook for managing messaging functionality
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Auto-fetch conversations on mount (default: true)
 * @returns {Object} Messages state and functions
 */
export function useMessages(options = {}) {
    const { autoFetch = true } = options;

    // State
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);

    // Refs for socket event handlers
    const selectedConversationRef = useRef(null);
    const mountedRef = useRef(true);

    // Keep ref in sync with state
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    // Track mounted state
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    /**
     * Fetch all conversations for the current user
     * Requirement 3.1: Return conversations sorted by last activity
     */
    const fetchConversations = useCallback(async (params = {}, withRetry = false) => {
        if (!isAuthenticated()) {
            return { success: false, error: { message: 'Not authenticated' } };
        }

        setConversationsLoading(true);
        if (withRetry) setRetrying(true);
        setError(null);

        try {
            const operation = () => messageService.getConversations(params);
            const response = withRetry
                ? await retryOperation(operation)
                : await operation();

            if (mountedRef.current) {
                if (response.success) {
                    setConversations(response.data.conversations || response.data || []);
                } else {
                    setError(response.error?.message || 'Failed to fetch conversations');
                }
            }

            return response;
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch conversations';
            if (mountedRef.current) {
                setError(errorMessage);
            }
            return { success: false, error: { message: errorMessage } };
        } finally {
            if (mountedRef.current) {
                setConversationsLoading(false);
                setRetrying(false);
            }
        }
    }, []);

    /**
     * Fetch a specific conversation with messages
     * @param {string} conversationId - Conversation ID
     */
    const fetchConversation = useCallback(async (conversationId, withRetry = false) => {
        if (!conversationId) return { success: false, error: { message: 'Conversation ID required' } };
        if (!isAuthenticated()) return { success: false, error: { message: 'Not authenticated' } };

        setMessagesLoading(true);
        if (withRetry) setRetrying(true);
        setError(null);

        try {
            const operation = () => messageService.getConversation(conversationId);
            const response = withRetry
                ? await retryOperation(operation)
                : await operation();

            if (mountedRef.current) {
                if (response.success) {
                    console.log('fetchConversation - Full API response:', response);
                    console.log('fetchConversation - response.data:', response.data);

                    const conversationData = response.data.conversation || response.data;
                    const messagesData = response.data.messages || [];

                    console.log('fetchConversation - conversationData:', conversationData);
                    console.log('fetchConversation - messagesData:', messagesData);

                    setSelectedConversation(conversationData);
                    setMessages(messagesData);

                    // Join socket room for this conversation
                    socketJoinConversation(conversationId);
                } else {
                    setError(response.error?.message || 'Failed to fetch conversation');
                }
            }

            return response;
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch conversation';
            if (mountedRef.current) {
                setError(errorMessage);
            }
            return { success: false, error: { message: errorMessage } };
        } finally {
            if (mountedRef.current) {
                setMessagesLoading(false);
                setRetrying(false);
            }
        }
    }, []);

    /**
     * Select a conversation and load its messages
     * @param {Object|string} conversation - Conversation object or ID
     */
    const selectConversation = useCallback(async (conversation) => {
        // Leave previous conversation room
        if (selectedConversationRef.current) {
            const prevId = selectedConversationRef.current._id || selectedConversationRef.current.id;
            socketLeaveConversation(prevId);
        }

        if (!conversation) {
            setSelectedConversation(null);
            setMessages([]);
            return;
        }

        const conversationId = typeof conversation === 'string'
            ? conversation
            : (conversation._id || conversation.id);

        // If we have the full conversation object with messages, use it immediately
        if (typeof conversation === 'object' && conversation.messages && conversation.messages.length > 0) {
            setSelectedConversation(conversation);
            setMessages(conversation.messages);

            // Join socket room
            socketJoinConversation(conversationId);
            return;
        }

        // Otherwise fetch the full conversation with messages
        await fetchConversation(conversationId);
    }, [fetchConversation]);

    /**
     * Send a message in the selected conversation
     * Requirement 2.1: Persist message with sender ID, text, timestamp, and read status
     * Requirement 4.1: Broadcast message via WebSocket
     * @param {string} text - Message text
     * @param {File} file - Optional file attachment
     * @returns {Promise<Object>} Response with created message
     */
    const sendMessage = useCallback(async (text, file = null) => {
        const conversation = selectedConversationRef.current;
        if (!conversation) {
            return { success: false, error: { message: 'No conversation selected' } };
        }

        const conversationId = conversation._id || conversation.id;
        if (!text?.trim() && !file) {
            return { success: false, error: { message: 'Message text or file is required' } };
        }

        setSending(true);
        setError(null);

        try {
            // Optimistic update - add message immediately
            const user = getUser();
            const tempId = `temp-${Date.now()}-${Math.random()}`;

            // Create preview URL for file if it's an image
            let filePreview = null;
            if (file && file.type.startsWith('image/')) {
                filePreview = URL.createObjectURL(file);
            }

            const optimisticMessage = {
                _id: tempId,
                id: tempId, // Ensure both id and _id are set
                sender: user?._id || user?.id,
                senderId: user?._id || user?.id, // Ensure both sender and senderId are set
                text: text?.trim() || '',
                image: filePreview, // Add image preview for optimistic update
                file: file ? {
                    name: file.name,
                    size: file.size,
                    type: file.type
                } : null,
                createdAt: new Date().toISOString(),
                timestamp: new Date().toISOString(), // Ensure both timestamp fields are set
                read: false,
                pending: true
            };

            setMessages(prev => [...prev, optimisticMessage]);

            // Send via API with retry
            const response = await retryOperation(
                () => messageService.sendMessage(conversationId, text, file),
                2, // Fewer retries for send operations
                500
            );

            if (mountedRef.current) {
                if (response.success) {
                    console.log('Server response for message:', response.data);

                    // The actual message is in response.data.message, not response.data
                    const messageData = response.data.message || response.data;

                    // Clean up preview URL
                    if (filePreview) {
                        URL.revokeObjectURL(filePreview);
                    }

                    // Replace optimistic message with real one
                    setMessages(prev =>
                        prev.map(msg => {
                            if (msg._id === optimisticMessage._id) {
                                const newMessage = { ...messageData, pending: false };
                                console.log('Replacing optimistic message with:', newMessage);
                                return newMessage;
                            }
                            return msg;
                        })
                    );

                    // Update conversation in list
                    setConversations(prev =>
                        prev.map(conv => {
                            if ((conv._id || conv.id) === conversationId) {
                                return {
                                    ...conv,
                                    lastMessage: {
                                        sender: messageData.sender,
                                        text: messageData.text || (file ? `📎 ${file.name}` : ''),
                                        createdAt: messageData.createdAt
                                    },
                                    lastActivityAt: messageData.createdAt
                                };
                            }
                            return conv;
                        }).sort((a, b) =>
                            new Date(b.lastActivityAt) - new Date(a.lastActivityAt)
                        )
                    );
                } else {
                    // Clean up preview URL on failure
                    if (filePreview) {
                        URL.revokeObjectURL(filePreview);
                    }

                    // Remove optimistic message on failure
                    setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
                    setError(response.error?.message || 'Failed to send message');
                }
            }

            return response;
        } catch (err) {
            // Remove optimistic message on error
            if (mountedRef.current) {
                setMessages(prev => prev.filter(msg => !msg.pending));
                const errorMessage = err.message || 'Failed to send message';
                setError(errorMessage);
            }
            return { success: false, error: { message: err.message || 'Failed to send message' } };
        } finally {
            if (mountedRef.current) {
                setSending(false);
            }
        }
    }, []);

    /**
     * Mark all messages in a conversation as read
     * Requirement 3.3: Mark messages as read and reset unread count
     * @param {string} conversationId - Conversation ID (optional, uses selected if not provided)
     */
    const markAsRead = useCallback(async (conversationId = null) => {
        const convId = conversationId ||
            selectedConversationRef.current?._id ||
            selectedConversationRef.current?.id;

        if (!convId) {
            return { success: false, error: { message: 'No conversation specified' } };
        }

        try {
            const response = await messageService.markAsRead(convId);

            if (response.success && mountedRef.current) {
                // Update messages read status
                setMessages(prev =>
                    prev.map(msg => ({ ...msg, read: true }))
                );

                // Update conversation unread count
                setConversations(prev =>
                    prev.map(conv => {
                        if ((conv._id || conv.id) === convId) {
                            const user = getUser();
                            const userId = user?._id || user?.id;
                            return {
                                ...conv,
                                unreadCount: conv.unreadCount instanceof Map
                                    ? new Map(conv.unreadCount).set(userId, 0)
                                    : { ...conv.unreadCount, [userId]: 0 }
                            };
                        }
                        return conv;
                    })
                );
            }

            return response;
        } catch (err) {
            return { success: false, error: { message: err.message } };
        }
    }, []);

    /**
     * Create or get an existing conversation
     * @param {string} recipientId - Recipient user ID
     * @param {string} propertyId - Property ID
     */
    const createConversation = useCallback(async (recipientId, propertyId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await retryOperation(
                () => messageService.createConversation(recipientId, propertyId)
            );

            if (mountedRef.current) {
                if (response.success) {
                    // Add to conversations list if new
                    setConversations(prev => {
                        const exists = prev.some(conv =>
                            (conv._id || conv.id) === (response.data._id || response.data.id)
                        );
                        if (!exists) {
                            return [response.data, ...prev];
                        }
                        return prev;
                    });

                    // Select the conversation
                    await selectConversation(response.data);
                } else {
                    setError(response.error?.message || 'Failed to create conversation');
                }
            }

            return response;
        } catch (err) {
            const errorMessage = err.message || 'Failed to create conversation';
            if (mountedRef.current) {
                setError(errorMessage);
            }
            return { success: false, error: { message: errorMessage } };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [selectConversation]);

    /**
     * Delete a message (soft delete)
     * @param {string} messageId - Message ID
     */
    const deleteMessage = useCallback(async (messageId) => {
        try {
            const response = await messageService.deleteMessage(messageId);

            if (response.success && mountedRef.current) {
                // Remove message from local state
                setMessages(prev => prev.filter(msg =>
                    (msg._id || msg.id) !== messageId
                ));
            }

            return response;
        } catch (err) {
            return { success: false, error: { message: err.message } };
        }
    }, []);

    /**
     * Send typing indicator
     * @param {boolean} isTyping - Whether user is typing
     */
    const sendTypingIndicator = useCallback((isTyping) => {
        const conversation = selectedConversationRef.current;

        if (conversation) {
            const conversationId = conversation._id || conversation.id;
            if (isTyping) {
                sendTypingStart(conversationId);
            } else {
                sendTypingStop(conversationId);
            }
        }
    }, []);

    /**
     * Retry fetching conversations
     */
    const retryFetchConversations = useCallback(() => {
        return fetchConversations({}, true);
    }, [fetchConversations]);

    /**
     * Handle incoming message from socket
     */
    const handleNewMessage = useCallback((data) => {
        if (!mountedRef.current) return;

        const { conversationId, message } = data;
        const currentConv = selectedConversationRef.current;

        // Add message if it's for the selected conversation
        if (currentConv && (currentConv._id || currentConv.id) === conversationId) {
            setMessages(prev => {
                // Avoid duplicates
                const exists = prev.some(msg =>
                    (msg._id || msg.id) === (message._id || message.id)
                );
                if (exists) return prev;
                return [...prev, message];
            });
        }

        // Update conversation in list
        setConversations(prev =>
            prev.map(conv => {
                if ((conv._id || conv.id) === conversationId) {
                    const user = getUser();
                    const userId = user?._id || user?.id;
                    const isSelected = currentConv &&
                        (currentConv._id || currentConv.id) === conversationId;

                    return {
                        ...conv,
                        lastMessage: {
                            sender: message.sender,
                            text: message.text,
                            createdAt: message.createdAt
                        },
                        lastActivityAt: message.createdAt,
                        // Increment unread if not viewing this conversation
                        unreadCount: !isSelected
                            ? (typeof conv.unreadCount === 'object'
                                ? { ...conv.unreadCount, [userId]: (conv.unreadCount[userId] || 0) + 1 }
                                : (conv.unreadCount || 0) + 1)
                            : conv.unreadCount
                    };
                }
                return conv;
            }).sort((a, b) =>
                new Date(b.lastActivityAt) - new Date(a.lastActivityAt)
            )
        );
    }, []);

    /**
     * Handle read status update from socket
     */
    const handleReadUpdate = useCallback((data) => {
        if (!mountedRef.current) return;

        const { conversationId } = data;
        const currentConv = selectedConversationRef.current;

        if (currentConv && (currentConv._id || currentConv.id) === conversationId) {
            setMessages(prev =>
                prev.map(msg => ({ ...msg, read: true }))
            );
        }
    }, []);

    // Setup socket listeners
    useEffect(() => {
        if (!isAuthenticated()) return;

        // Set up socket event listeners
        onMessageReceived(handleNewMessage);
        onMessageReadUpdate(handleReadUpdate);

        // Cleanup
        return () => {
            // Leave conversation room on unmount
            if (selectedConversationRef.current) {
                const convId = selectedConversationRef.current._id || selectedConversationRef.current.id;
                socketLeaveConversation(convId);
            }
        };
    }, [handleNewMessage, handleReadUpdate]);

    // Fetch conversations on mount
    useEffect(() => {
        if (isAuthenticated() && autoFetch) {
            fetchConversations();
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear error after timeout
    useEffect(() => {
        if (error) {
            const timeout = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timeout);
        }
    }, [error]);

    return {
        // State
        conversations,
        selectedConversation,
        messages,
        loading,
        conversationsLoading,
        messagesLoading,
        sending,
        error,
        retrying,

        // Actions
        fetchConversations,
        fetchConversation,
        selectConversation,
        sendMessage,
        markAsRead,
        createConversation,
        deleteMessage,
        sendTypingIndicator,
        retryFetchConversations,

        // Setters for external updates
        setConversations,
        setSelectedConversation,
        setMessages,
        setError
    };
}

export default useMessages;
