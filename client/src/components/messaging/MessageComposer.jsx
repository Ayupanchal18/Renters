import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, X, FileText, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";
import { getUser } from "../../utils/auth";
import { cn } from "../../lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

const EMOJI_LIST = [
    "😀", "😃", "😄", "😁", "😅", "😂", "😊", "😇", "🙂", "😉",
    "😍", "😘", "😋", "😎", "🤔", "👍", "👎", "👏", "🙌", "🙏",
    "❤️", "🔥", "✨", "🎉", "🏠", "🔑", "📍", "📅"
];

const TENANT_TEMPLATES = [
    "Is this property still available?",
    "Can I schedule a visit?",
    "What's included in the rent (utilities, maintenance)?",
    "I'm interested — what are the next steps?"
];

const LANDLORD_TEMPLATES = [
    "Hi! The property is still available. Would you like to schedule a visit?",
    "Hi! What day and time works best for you to view the property?",
    "Yes, it is available. Do you have any questions about lease duration or deposit?",
    "Sure, let's set up a call. When are you free?"
];

export function MessageComposer({ onSendMessage, disabled = false, onTypingChange }) {
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Get current user role to choose template set
    const user = getUser();
    const isLandlord = user?.role === "seller" || user?.role === "admin" || user?.userType === "seller" || user?.userType === "agent";
    const templates = isLandlord ? LANDLORD_TEMPLATES : TENANT_TEMPLATES;

    const handleSend = async () => {
        if (!message.trim() && !selectedFile) return;
        
        try {
            // Stop typing indicator immediately when message is sent
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            onTypingChange?.(false);

            if (selectedFile) {
                await onSendMessage(message, selectedFile);
            } else {
                await onSendMessage(message);
            }
            
            setMessage("");
            clearFile();
        } catch (error) {
            setUploadError(error.message || "Failed to send message");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaChange = (e) => {
        setMessage(e.target.value);
        
        // Emit typing start
        onTypingChange?.(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing after 1.5 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            onTypingChange?.(false);
        }, 1500);
    };

    const handleEmojiSelect = (emoji) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newMessage = message.substring(0, start) + emoji + message.substring(end);
            setMessage(newMessage);
            
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
            }, 0);
        } else {
            setMessage(prev => prev + emoji);
        }
        setShowEmojiPicker(false);
    };

    const handleTemplateSelect = (template) => {
        setMessage(template);
        setShowTemplates(false);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError(null);

        if (file.size > MAX_FILE_SIZE) {
            setUploadError(`File size must be less than 10MB`);
            return;
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setUploadError("File type not supported. Please use images (JPG/PNG/WEBP/GIF) or PDFs.");
            return;
        }

        setSelectedFile(file);

        if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const isImage = selectedFile && ALLOWED_IMAGE_TYPES.includes(selectedFile.type);

    return (
        <div className="bg-card border-t border-border p-3 flex flex-col gap-2 relative">
            {/* Popups (Emojis / Templates / Error) */}
            
            {/* File Upload Error */}
            {uploadError && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-xs">
                    <span className="flex-1 font-semibold">{uploadError}</span>
                    <button onClick={() => setUploadError(null)} className="text-xs font-bold hover:opacity-85">
                        ✕
                    </button>
                </div>
            )}

            {/* Selected File Chip Preview */}
            {selectedFile && (
                <div className="p-2 bg-muted rounded-xl border border-border flex items-center gap-2 max-w-sm">
                    {isImage && filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={clearFile} className="text-muted-foreground hover:text-foreground p-1" aria-label="Remove attachment">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2 relative">
                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(",")}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Attach File Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0 rounded-xl active:scale-95"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    aria-label="Attach file"
                >
                    <Paperclip className="w-4 h-4" />
                </Button>

                {/* Quick Reply Templates Button */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0 rounded-xl active:scale-95",
                            showTemplates && "bg-muted text-primary"
                        )}
                        onClick={() => {
                            setShowTemplates(!showTemplates);
                            setShowEmojiPicker(false);
                        }}
                        disabled={disabled}
                        aria-label="Select message template"
                        title="Quick Reply Templates"
                    >
                        <ChevronUp className={cn("w-4 h-4 transition-transform", showTemplates && "rotate-180")} />
                    </Button>

                    {showTemplates && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)} />
                            <div className="absolute bottom-full left-0 mb-2 p-2 bg-card border border-border rounded-xl shadow-lg z-50 w-72 flex flex-col gap-1">
                                <p className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                                    {isLandlord ? "Landlord Templates" : "Tenant Templates"}
                                </p>
                                {templates.map((tpl, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleTemplateSelect(tpl)}
                                        className="w-full text-left text-xs text-foreground px-2 py-2 hover:bg-muted rounded-lg transition-colors truncate"
                                        title={tpl}
                                    >
                                        {tpl}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Input Textarea */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyPress}
                    disabled={disabled}
                    placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                    className="flex-1 px-3.5 py-2 border border-border rounded-2xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none text-xs min-h-[36px] max-h-24 leading-snug"
                    rows={1}
                />

                {/* Emoji Trigger Button */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0 rounded-xl active:scale-95",
                            showEmojiPicker && "bg-muted text-primary"
                        )}
                        onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker);
                            setShowTemplates(false);
                        }}
                        disabled={disabled}
                        aria-label="Add emoji"
                    >
                        <Smile className="w-4 h-4" />
                    </Button>

                    {showEmojiPicker && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                            <div className="absolute bottom-full right-0 mb-2 p-2 bg-card border border-border rounded-xl shadow-lg z-50 w-56">
                                <div className="grid grid-cols-6 gap-1">
                                    {EMOJI_LIST.map((emoji, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleEmojiSelect(emoji)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-lg text-base transition-all duration-100 hover:scale-110 active:scale-95"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Send Button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || (!message.trim() && !selectedFile)}
                    className="h-9 w-9 flex-shrink-0 rounded-xl active:scale-95 transition-transform"
                    size="icon"
                    aria-label="Send message"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
