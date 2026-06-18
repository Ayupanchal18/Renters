import { MessageSquare } from "lucide-react";

export function EmptyChatState() {
    return (
        <div className="flex-1 flex items-center justify-center h-full bg-muted/10">
            <div className="text-center p-6 space-y-3 max-w-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                    Select a conversation
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                    Choose a tenant or property owner from the list on the left to start messaging.
                </p>
            </div>
        </div>
    );
}
