import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, Paperclip, Smile } from "lucide-react";

export function MessageComposer({ onSendMessage, disabled = false }) {
    const [message, setMessage] = useState("");
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message);
            setMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-white border-t border-gray-200 p-4">
            {/* Attachment Preview (Static) */}
            {showAttachmentPreview && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img
                            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop"
                            alt="Preview"
                            className="w-12 h-12 rounded object-cover"
                        />
                        <span className="text-sm text-gray-600">rental_property.jpg</span>
                    </div>

                    <button
                        onClick={() => setShowAttachmentPreview(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="flex items-end gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gray-100 flex-shrink-0"
                    onClick={() => setShowAttachmentPreview(!showAttachmentPreview)}
                >
                    <Paperclip className="w-5 h-5 text-gray-600" />
                </Button>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={disabled}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-24"
                    rows={1}
                />

                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gray-100 flex-shrink-0"
                >
                    <Smile className="w-5 h-5 text-gray-600" />
                </Button>

                <Button
                    onClick={handleSend}
                    disabled={disabled || !message.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
                    size="icon"
                >
                    <Send className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
