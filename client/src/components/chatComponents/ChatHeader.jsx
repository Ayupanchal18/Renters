import { Phone, Video, MoreVertical } from "lucide-react";
import { Button } from "../ui/button";

export function ChatHeader({ participant }) {
    // Create a simple avatar fallback using CSS
    const getAvatarFallback = (name) => {
        const initials = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return initials;
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card rounded-tr-xl">
            <div className="flex items-center gap-3">
                <div className="relative">
                    {participant.avatar ? (
                        <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 ring-2 ring-border flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                                {getAvatarFallback(participant.name)}
                            </span>
                        </div>
                    )}
                    {participant.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-card" />
                    )}
                </div>
                <div>
                    <h2 className="font-semibold text-foreground">{participant.name}</h2>
                    <p className="text-xs text-muted-foreground">
                        {participant.isOnline ? (
                            <span className="text-success">Online</span>
                        ) : (
                            "Offline"
                        )}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-muted text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
