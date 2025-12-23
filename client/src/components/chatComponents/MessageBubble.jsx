import { Clock, Download, FileText, Image as ImageIcon } from "lucide-react";

export function MessageBubble({ message, isOwn, isPending = false }) {
    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return "";
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Use timestamp or createdAt field
    const messageTime = message.timestamp || message.createdAt;
    
    // Check if message has file attachment
    const hasFile = message.image || message.file || message.attachment;
    const isImageFile = message.image || (message.file && message.file.type?.startsWith('image/'));

    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1 w-full`}>
            <div
                className={`max-w-[80%] sm:max-w-[75%] lg:max-w-md px-3 py-1.5 rounded-2xl overflow-hidden ${
                    isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card text-foreground border border-border rounded-bl-sm"
                } ${isPending ? "opacity-70" : ""}`}
            >
                {/* Image attachment */}
                {message.image && (
                    <div className="mb-2">
                        <img
                            src={message.image}
                            alt="Message attachment"
                            className="w-full rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.image, '_blank')}
                        />
                    </div>
                )}

                {/* Non-image file attachment */}
                {message.file && !isImageFile && (
                    <div className="mb-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                {message.file.type?.includes('pdf') ? (
                                    <FileText className="w-8 h-8 text-red-500" />
                                ) : (
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {message.file.name || 'File attachment'}
                                </p>
                                {message.file.size && (
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(message.file.size)}
                                    </p>
                                )}
                            </div>
                            {message.file.url && (
                                <button
                                    onClick={() => window.open(message.file.url, '_blank')}
                                    className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                                    title="Download file"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Message text */}
                {message.text && <p className="break-words text-sm whitespace-pre-wrap overflow-wrap-anywhere">{message.text}</p>}

                {/* Timestamp and status */}
                <div className={`flex items-center gap-1 mt-0.5 ${
                    isOwn ? "justify-end" : "justify-start"
                }`}>
                    {isPending && (
                        <Clock className={`w-3 h-3 ${
                            isOwn ? "text-primary-foreground/50" : "text-muted-foreground/50"
                        }`} />
                    )}
                    <p
                        className={`text-xs ${
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                    >
                        {isPending ? "Sending..." : formatTime(messageTime)}
                    </p>
                </div>
            </div>
        </div>
    );
}
