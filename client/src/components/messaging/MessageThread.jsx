import { useEffect, useRef, useState } from "react";
import { MessageSquare, ArrowDown, UploadCloud } from "lucide-react";
import { MessageBubble } from "./MessageBubble";

// Date separator formatter
function getFriendlyDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

export function MessageThread({
    messages = [],
    currentUserId,
    isRecipientTyping = false,
    onFileSelect,
}) {
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [showScrollPill, setShowScrollPill] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [prevMsgCount, setPrevMsgCount] = useState(0);

    const scrollToBottom = (behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
        setTimeout(() => {
            setShowScrollPill(false);
            setShouldAutoScroll(true);
        }, 0);
    };

    const isNearBottom = () => {
        if (!containerRef.current) return true;
        const container = containerRef.current;
        const threshold = 120; // px threshold
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    };

    const handleScroll = () => {
        const nearBottom = isNearBottom();
        setShouldAutoScroll(nearBottom);
        
        // Show floating action pill if scrolled up considerably
        if (containerRef.current) {
            const container = containerRef.current;
            const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 300;
            setShowScrollPill(isScrolledUp);
        }
    };

    // Auto-scroll on mount or conversation swap
    useEffect(() => {
        scrollToBottom("auto");
        setPrevMsgCount(messages.length);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages[0]?.id || messages[0]?._id]); // Run when conversation changes (first message changes)

    // Auto-scroll on new message if user is near bottom
    useEffect(() => {
        if (messages.length > prevMsgCount) {
            const lastMsg = messages[messages.length - 1];
            const isOwn = lastMsg?.senderId === currentUserId || lastMsg?.sender === currentUserId;
            
            if (isOwn || shouldAutoScroll) {
                scrollToBottom("smooth");
            } else {
                setShowScrollPill(true);
            }
        }
        setPrevMsgCount(messages.length);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length, currentUserId]);

    // Scroll to bottom on typing start
    useEffect(() => {
        if (isRecipientTyping && shouldAutoScroll) {
            scrollToBottom("smooth");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecipientTyping]);

    // Drag and Drop attachment handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onFileSelect) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (onFileSelect && e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            onFileSelect(file);
        }
    };

    // Group messages by date to render dividers
    const renderedElements = [];
    let lastDateStr = null;

    messages.forEach((msg, idx) => {
        const msgTime = msg.timestamp || msg.createdAt;
        const msgDateStr = msgTime ? new Date(msgTime).toDateString() : "";

        if (msgDateStr && msgDateStr !== lastDateStr) {
            renderedElements.push(
                <div key={`date-divider-${idx}`} className="flex justify-center my-4">
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-full border border-border/50">
                        {getFriendlyDate(msgTime)}
                    </span>
                </div>
            );
            lastDateStr = msgDateStr;
        }

        renderedElements.push(
            <MessageBubble
                key={msg.id || msg._id || `msg-${idx}`}
                message={msg}
                isOwn={msg.senderId === currentUserId || msg.sender === currentUserId}
                isPending={msg.pending}
            />
        );
    });

    return (
        <div 
            className="flex-1 min-h-0 relative flex flex-col"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Scrollable Container with ARIA live region */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                aria-live="polite"
                className="flex-1 overflow-y-auto px-4 py-3 bg-muted/20 space-y-1 scroll-smooth"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                            <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground text-sm">No messages yet</p>
                        <p className="text-xs text-muted-foreground max-w-xs text-center">
                            Start the conversation by typing a message or dragging a file below
                        </p>
                    </div>
                ) : (
                    <>
                        {renderedElements}
                        
                        {/* Bouncing Dots typing indicator */}
                        {isRecipientTyping && (
                            <div className="flex justify-start mb-2 w-full animate-fade-in">
                                <div className="bg-card text-foreground border border-border rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-1 shadow-sm">
                                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Floating New Message / Scroll down Pill */}
            {showScrollPill && (
                <button
                    onClick={() => scrollToBottom("smooth")}
                    className="absolute bottom-4 right-4 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-3 py-2 rounded-full shadow-lg flex items-center gap-1.5 transition-all duration-200 active:scale-95 z-30"
                >
                    <ArrowDown className="w-3.5 h-3.5" />
                    New message
                </button>
            )}

            {/* Drag & Drop Themed Overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-background/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary rounded-xl m-2 animate-fade-in">
                    <div className="p-4 bg-primary/10 rounded-full mb-3 text-primary">
                        <UploadCloud className="w-8 h-8 animate-bounce" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">Drop file to send</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Accepts images (JPG/PNG/WEBP/GIF) or PDFs up to 10MB
                    </p>
                </div>
            )}
        </div>
    );
}
