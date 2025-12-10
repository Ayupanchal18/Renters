import { useEffect, useRef } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { MessageSquare } from "lucide-react";

export function ChatWindow({
    conversation,
    currentUserId,
    onSendMessage,
    sending = false,
}) {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation.messages]);

    const participant = conversation.participants[0];

    return (
        <div className="flex flex-col h-full bg-white">
            <ChatHeader participant={participant} />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
                {conversation.messages && conversation.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm text-gray-400">
                            Start the conversation by typing below
                        </p>
                    </div>
                ) : (
                    <div>
                        {conversation.messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isOwn={message.senderId === currentUserId}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Composer */}
            <MessageComposer onSendMessage={onSendMessage} disabled={sending} />
        </div>
    );
}
