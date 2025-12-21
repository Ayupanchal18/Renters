import { MessageSquare } from "lucide-react";

export function EmptyChatState() {
    return (
        <div className="flex items-center justify-center h-full bg-muted/30 rounded-r-xl">
            <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Select a conversation
                </h2>
                <p className="text-muted-foreground max-w-sm">
                    Choose a conversation from the list to start messaging
                </p>
            </div>
        </div>
    );
}
