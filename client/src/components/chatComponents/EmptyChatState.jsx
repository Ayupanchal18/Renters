import { MessageSquare } from "lucide-react";

export function EmptyChatState() {
    return (
        <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Select a conversation
                </h2>
                <p className="text-gray-500 max-w-sm">
                    Choose a conversation from the list to start messaging
                </p>
            </div>
        </div>
    );
}
