import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Send, Paperclip, Smile, X, Image, FileText, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export function MessageComposer({ onSendMessage, disabled = false }) {
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    const handleSend = async () => {
        if (!message.trim() && !selectedFile) return;
        
        try {
            if (selectedFile) {
                // Send message with file
                await onSendMessage(message, selectedFile);
            } else {
                // Send text-only message
                await onSendMessage(message);
            }
            
            // Clear form
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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadError(null);

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            setUploadError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        // Check file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setUploadError('File type not supported. Please use images, PDFs, or text documents.');
            return;
        }

        setSelectedFile(file);

        // Create preview for images
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
        <div className="bg-card border-t border-border p-4">
            {/* File Upload Error */}
            {uploadError && (
                <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                    <button 
                        onClick={() => setUploadError(null)}
                        className="ml-auto text-xs hover:underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* File Preview */}
            {selectedFile && (
                <div className="mb-3 p-3 bg-muted rounded-xl border border-border">
                    <div className="flex items-start gap-3">
                        {isImage && filePreview ? (
                            <img
                                src={filePreview}
                                alt="Preview"
                                className="w-16 h-16 rounded object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                                {selectedFile.type.includes('pdf') ? (
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                ) : (
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>

                        <button
                            onClick={clearFile}
                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-end gap-3">
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
                    className="hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    aria-label="Attach file"
                >
                    <Paperclip className="w-5 h-5" />
                </Button>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={disabled}
                    placeholder={selectedFile ? "Add a caption..." : "Type your message..."}
                    className="flex-1 px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none max-h-24"
                    rows={1}
                />

                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                    disabled={disabled}
                    aria-label="Add emoji"
                >
                    <Smile className="w-5 h-5" />
                </Button>

                <Button
                    onClick={handleSend}
                    disabled={disabled || (!message.trim() && !selectedFile)}
                    className="flex-shrink-0"
                    size="icon"
                    aria-label="Send message"
                >
                    <Send className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
