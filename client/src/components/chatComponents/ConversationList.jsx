import { useState, useMemo } from "react";
import { ConversationItem } from "./ConversationItem";
import { Input } from "../ui/input";
import { Search, MessageSquare, RefreshCw } from "lucide-react";

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
            // Search by participant name
            const participantMatch = conv.participants?.some(p => 
                p.name?.toLowerCase().includes(query)
            );
            
            // Search by last message content
            const messageMatch = conv.lastMessage?.text?.toLowerCase().includes(query);
            
            return participantMatch || messageMatch;
        });
    }, [conversations, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-card rounded-l-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-5 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-foreground">Messages</h1>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
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
                        className="pl-10 bg-muted border-0 focus:ring-2 focus:ring-ring rounded-lg"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        <div className="text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p>Loading conversations...</p>
                        </div>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        <div className="text-center">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                            {searchQuery ? (
                                <>
                                    <p className="font-medium">No results found</p>
                                    <p className="text-sm text-muted-foreground/70">
                                        Try a different search term
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="font-medium">No conversations yet</p>
                                    <p className="text-sm text-muted-foreground/70">
                                        Start a conversation by viewing a property
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-2 px-2 space-y-1">
                        {filteredConversations.map((conversation) => {
                            const convId = conversation.id || conversation._id;
                            return (
                                <ConversationItem
                                    key={convId}
                                    conversation={conversation}
                                    isSelected={selectedConversationId === convId}
                                    onClick={() => onSelectConversation(conversation)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
