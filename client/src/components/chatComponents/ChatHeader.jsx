import { Phone, Video, MoreVertical } from "lucide-react";
import { Button } from "../ui/button";

export function ChatHeader({ participant }) {
    // Create a simple avatar fallback using CSS
    const getAvatarFallback = (name) => {
        const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return initials;
    };

    return (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-card rounded-tr-xl">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                    {participant.avatar ? (
                        <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-border"
                        />
                    ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 ring-2 ring-border flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                                {getAvatarFallback(participant.name)}
                            </span>
                        </div>
                    )}
                    {participant.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-card" />
                    )}
                </div>
                <div className="min-w-0">
                    <h2 className="font-semibold text-foreground text-sm sm:text-base truncate">{participant.name}</h2>
                    <p className="text-xs text-muted-foreground">
                        {participant.isOnline ? (
                            <span className="text-success">Online</span>
                        ) : (
                            "Offline"
                        )}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="hover:bg-muted text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-muted text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10">
                    <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-muted text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10">
                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
            </div>
        </div>
    );
}
