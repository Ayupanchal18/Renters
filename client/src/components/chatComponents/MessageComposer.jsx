import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Send, Paperclip, Smile, X, Image, FileText, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Common emojis for quick access
const EMOJI_LIST = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😍', '🥰', '😘', '😋', '😎', '🤔', '🤗', '🤩', '😏',
    '😢', '😭', '😤', '😠', '🤯', '😱', '😰', '🥺', '😴', '🤮',
    '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞', '👋', '🙏',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💯', '✨',
    '🔥', '⭐', '🎉', '🎊', '💐', '🏠', '🏡', '🏢', '🔑', '📍'
];

export function MessageComposer({ onSendMessage, disabled = false }) {
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const handleSend = async () => {
        if (!message.trim() && !selectedFile) return;
        
        try {
            if (selectedFile) {
                await onSendMessage(message, selectedFile);
            } else {
                await onSendMessage(message);
            }
            
            setMessage("");
            clearFile();
        } catch (error) {
            setUploadError(error.message || 'Failed to send message');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEmojiSelect = (emoji) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newMessage = message.substring(0, start) + emoji + message.substring(end);
            setMessage(newMessage);
            
            // Set cursor position after emoji
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
            }, 0);
        } else {
            setMessage(prev => prev + emoji);
        }
        setShowEmojiPicker(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError(null);

        if (file.size > MAX_FILE_SIZE) {
            setUploadError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setUploadError('File type not supported. Please use images, PDFs, or text documents.');
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
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isImage = selectedFile && ALLOWED_IMAGE_TYPES.includes(selectedFile.type);

    return (
        <div className="bg-card border-t border-border p-2 sm:p-3 pb-safe">
            {/* File Upload Error */}
            {uploadError && (
                <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1">{uploadError}</span>
                    <button onClick={() => setUploadError(null)} className="text-xs hover:underline">
                        ✕
                    </button>
                </div>
            )}

            {/* File Preview */}
            {selectedFile && (
                <div className="mb-2 p-2 bg-muted rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                        {isImage && filePreview ? (
                            <img src={filePreview} alt="Preview" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-10 h-10 rounded bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button onClick={clearFile} className="text-muted-foreground hover:text-foreground p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-end gap-1.5 sm:gap-2 relative">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    aria-label="Attach file"
                >
                    <Paperclip className="w-4 h-4" />
                </Button>

                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={disabled}
                    placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                    className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none text-sm min-h-[36px] max-h-20"
                    rows={1}
                />

                {/* Emoji Button with Picker */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={disabled}
                        aria-label="Add emoji"
                    >
                        <Smile className="w-4 h-4" />
                    </Button>

                    {/* Emoji Picker Dropdown */}
                    {showEmojiPicker && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowEmojiPicker(false)}
                            />
                            <div className="absolute bottom-full right-0 mb-2 p-2 bg-card border border-border rounded-lg shadow-lg z-50 w-64">
                                <div className="grid grid-cols-8 gap-1">
                                    {EMOJI_LIST.map((emoji, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleEmojiSelect(emoji)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded text-base transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <Button
                    onClick={handleSend}
                    disabled={disabled || (!message.trim() && !selectedFile)}
                    className="h-9 w-9 flex-shrink-0"
                    size="icon"
                    aria-label="Send message"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
