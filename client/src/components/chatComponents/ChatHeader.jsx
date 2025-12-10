import { Phone, Video, MoreVertical } from "lucide-react";
import { Button } from "../ui/button";

export function ChatHeader({ participant }) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-900">{participant.name}</h2>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                    <Phone className="w-5 h-5 text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                </Button>
            </div>
        </div>
    );
}
