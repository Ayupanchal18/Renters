import { ConversationItem } from "./ConversationItem";
import { Input } from "../ui/input";
import { Search, MessageSquare } from "lucide-react";

export function ConversationList({
    conversations,
    selectedConversationId,
    onSelectConversation,
    loading = false,
}) {
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search conversations..."
                        className="pl-10 bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-gray-500">
                        <div className="text-center">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>Loading conversations...</p>
                        </div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-500">
                        <div className="text-center">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="font-medium">No conversations yet</p>
                            <p className="text-sm text-gray-400">
                                Start a conversation by viewing a property
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        {conversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={selectedConversationId === conversation.id}
                                onClick={() => onSelectConversation(conversation)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
