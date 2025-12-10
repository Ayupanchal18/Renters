import { useState } from "react";
import { ConversationList } from "../components/chatComponents/ConversationList";
import { ChatWindow } from "../components/chatComponents/ChatWindow.jsx";
import { EmptyChatState } from "../components/chatComponents/EmptyChatState.jsx";
import { ChevronLeft } from "lucide-react";
import Navbar from './../components/Navbar';
import Footer from './../components/Footer';

// Mock data - static for now, will be connected to backend later
const MOCK_CONVERSATIONS = [
    {
        id: "1",
        participants: [
            {
                id: "user-2",
                name: "Sarah Johnson",
                email: "sarah@example.com",
                avatar:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
                isOnline: true,
            },
        ],
        lastMessage: {
            id: "msg-7",
            senderId: "user-2",
            senderName: "Sarah Johnson",
            senderAvatar:
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
            text: "Is the apartment still available for rent next month?",
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
            read: false,
        },
        lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(),
        unreadCount: 1,
        messages: [
            {
                id: "msg-1",
                senderId: "user-2",
                senderName: "Sarah Johnson",
                senderAvatar:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
                text: "Hi! I'm interested in the 2-bedroom apartment you listed.",
                timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-2",
                senderId: "current-user",
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                text: "Hi Sarah! Yes, it's available. Would you like to schedule a viewing?",
                timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-3",
                senderId: "user-2",
                senderName: "Sarah Johnson",
                senderAvatar:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
                text: "That would be great! Can you do this weekend?",
                timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-4",
                senderId: "current-user",
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                image:
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
                timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-5",
                senderId: "user-2",
                senderName: "Sarah Johnson",
                senderAvatar:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
                text: "Wow, it looks amazing! The living room is perfect.",
                timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-6",
                senderId: "current-user",
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                text: "Thanks! It just got renovated last month. Are you free Saturday at 2 PM?",
                timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-7",
                senderId: "user-2",
                senderName: "Sarah Johnson",
                senderAvatar:
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
                text: "Is the apartment still available for rent next month?",
                timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
                read: false,
            },
        ],
    },
    {
        id: "2",
        participants: [
            {
                id: "user-3",
                name: "Michael Chen",
                email: "michael.chen@example.com",
                avatar:
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
                isOnline: false,
            },
        ],
        lastMessage: {
            id: "msg-14",
            senderId: "current-user",
            senderName: "You",
            senderAvatar:
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
            text: "Perfect! I'll send you the contract details by tomorrow.",
            timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
            read: true,
        },
        lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        unreadCount: 0,
        messages: [
            {
                id: "msg-8",
                senderId: "user-3",
                senderName: "Michael Chen",
                senderAvatar:
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
                text: "Hey! I saw your listing for the office space downtown.",
                timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
                read: true,
            },
            {
                id: "msg-9",
                senderId: "current-user",
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                text: "Hello Michael! Yes, it's a great space for small businesses. What kind of business are you running?",
                timestamp: new Date(Date.now() - 4.5 * 3600000).toISOString(),
                read: true,
            },
            {
                id: "msg-10",
                senderId: "user-3",
                senderName: "Michael Chen",
                senderAvatar:
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
                text: "I'm starting a tech startup. We're a team of 5 people. Does the space have good internet?",
                timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
                read: true,
            },
            {
                id: "msg-11",
                senderId: "current-user",
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                text: "Absolutely! Fiber optic connection, 1Gbps. Plus there's a conference room and kitchen area.",
                timestamp: new Date(Date.now() - 3.5 * 3600000).toISOString(),
                read: true,
            },
            {
                id: "msg-12",
                senderId: "user-3",
                senderName: "Michael Chen",
                senderAvatar:
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
                text: "That sounds perfect! What's the monthly rate?",
                timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
                read: true,
            },
            {
                id: "msg-13",
                senderId: "user-3",
                senderName: "Michael Chen",
                senderAvatar:
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
                text: "Also, is parking included?",
                timestamp: new Date(Date.now() - 2.8 * 3600000).toISOString(),
                read: true,
            },
            {
                id: "msg-14",
                senderId: "current-user",
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                text: "Perfect! I'll send you the contract details by tomorrow.",
                timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
                read: true,
            },
        ],
    },
    {
        id: "3",
        participants: [
            {
                id: "user-4",
                name: "Emma Williams",
                email: "emma.w@example.com",
                avatar:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
                isOnline: true,
            },
        ],
        lastMessage: {
            id: "msg-19",
            senderId: "user-4",
            senderName: "Emma Williams",
            senderAvatar:
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
            text: "Thanks so much! Talk soon 😊",
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            read: true,
        },
        lastMessageTime: new Date(Date.now() - 30 * 60000).toISOString(),
        unreadCount: 0,
        messages: [
            {
                id: "msg-15",
                senderId: "user-4",
                senderName: "Emma Williams",
                senderAvatar:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
                text: "Hi there! Quick question about the studio apartment.",
                timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-16",
                senderId: "current-user",
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                text: "Hi Emma! Sure, what would you like to know?",
                timestamp: new Date(Date.now() - 85 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-17",
                senderId: "user-4",
                senderName: "Emma Williams",
                senderAvatar:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
                text: "Are pets allowed? I have a small cat.",
                timestamp: new Date(Date.now() - 80 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-18",
                senderId: "current-user",
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                text: "Yes! We're pet-friendly. There's a small pet deposit of$200, fully refundable.",
                timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
                read: true,
            },
            {
                id: "msg-19",
                senderId: "user-4",
                senderName: "Emma Williams",
                senderAvatar:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
                text: "Thanks so much! Talk soon 😊",
                timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
                read: true,
            },
        ],
    },
];

export default function Messages() {
    const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
    const [selectedConversation, setSelectedConversation] = useState(
        MOCK_CONVERSATIONS[0]
    );
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [sending, setSending] = useState(false);

    const currentUserId = "current-user";

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setShowMobileChat(true);
    };

    const handleSendMessage = async (messageText) => {
        if (!selectedConversation || !messageText.trim()) return;

        try {
            setSending(true);

            const newMessage = {
                id: `msg-${Date.now()}`,
                senderId: currentUserId,
                senderName: "You",
                senderAvatar:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                text: messageText,
                timestamp: new Date().toISOString(),
                read: true,
            };

            const updatedConversations = conversations.map((conv) => {
                if (conv.id === selectedConversation.id) {
                    return {
                        ...conv,
                        messages: [...conv.messages, newMessage],
                        lastMessage: newMessage,
                        lastMessageTime: newMessage.timestamp,
                    };
                }
                return conv;
            });

            setConversations(updatedConversations);

            const updated = updatedConversations.find(
                (conv) => conv.id === selectedConversation.id
            );

            if (updated) setSelectedConversation(updated);

            await new Promise((r) => setTimeout(r, 300));
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="h-[90vh] bg-gray-100 flex flex-col ">
                {/* Mobile header */}
                <div className="md:hidden bg-white border-b px-4 py-3 flex items-center ">
                    {showMobileChat && selectedConversation && (
                        <button
                            onClick={() => setShowMobileChat(false)}
                            className="mr-3 p-1"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <h1 className="text-lg font-bold">
                        {showMobileChat && selectedConversation
                            ? selectedConversation.participants[0].name
                            : "Messages"}
                    </h1>
                </div>

                {/* Layout */}
                <div className="flex flex-1 overflow-hidden p-5 ">
                    {/* Left panel */}
                    <div
                        className={`w-full md:w-[30rem] p-5 rounded-tl-[25px] rounded-bl-[25px] bg-white border-r flex flex-col${showMobileChat ? "hidden md:flex" : "flex"
                            }`}
                    >
                        <ConversationList
                            conversations={conversations}
                            selectedConversationId={selectedConversation?.id}
                            onSelectConversation={handleSelectConversation}
                            loading={false}
                        />
                    </div>

                    {/* Right panel */}
                    <div
                        className={`flex-1 flex rounded-tr-[25px] rounded-br-[25px] flex-col ${showMobileChat ? "flex" : "hidden md:flex"
                            }`}
                    >
                        {selectedConversation ? (
                            <ChatWindow
                                conversation={selectedConversation}
                                currentUserId={currentUserId}
                                onSendMessage={handleSendMessage}
                                sending={sending}
                            />
                        ) : (
                            <EmptyChatState />
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>

    );
}
