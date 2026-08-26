import React, { useState, useRef, useEffect } from "react";
import { 
    Sparkles, X, Send, Bot, User, RefreshCw, 
    MapPin, ChevronRight, MoreVertical, Paperclip, CheckCheck,
    Building2, Briefcase, Folder, MessageSquareText, HelpCircle, ShieldCheck
} from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

const QUICK_SERVICES = [
    { icon: Building2, label: "Rent Listings", prompt: "Show available rental properties" },
    { icon: Briefcase, label: "Buy Listings", prompt: "Show properties available for buy" },
    { icon: MessageSquareText, label: "Talk to Sales", prompt: "How can I contact a property manager or landlord?" },
    { icon: ShieldCheck, label: "Deposit Rules", prompt: "What are standard security deposit and lease rules?" }
];

export default function AiAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: "welcome-1",
            sender: "ai",
            text: "Hi there! 👋\nHow can I help you today?",
            timestamp: "10:30 AM",
            properties: []
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const formatCurrentTime = () => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Auto-scroll to bottom of message list
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (textToSend) => {
        const queryText = (textToSend || input).trim();
        if (!queryText || loading) return;

        const userMsg = {
            id: Date.now().toString(),
            sender: "user",
            text: queryText,
            timestamp: formatCurrentTime()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: queryText,
                    conversationHistory: messages.map(m => ({ role: m.sender, content: m.text }))
                })
            });

            const data = await res.json();
            if (data.success) {
                const aiMsg = {
                    id: (Date.now() + 1).toString(),
                    sender: "ai",
                    text: data.reply || "Here are matching property options for you:",
                    timestamp: formatCurrentTime(),
                    properties: data.matchedProperties || []
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                throw new Error(data.message || "Failed to get AI response");
            }
        } catch (err) {
            console.error("[AI Chat Error]:", err);
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    sender: "ai",
                    text: "I encountered a brief connection issue. Here are some featured properties you can explore on Renters!",
                    timestamp: formatCurrentTime(),
                    properties: []
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = () => {
        setMessages([
            {
                id: "welcome-1",
                sender: "ai",
                text: "Hi there! 👋\nHow can I help you today?",
                timestamp: formatCurrentTime(),
                properties: []
            }
        ]);
    };

    return (
        <div className="fixed bottom-20 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col items-end pointer-events-auto max-w-full">
            {/* Expanded Chatbot Drawer */}
            {isOpen && (
                <div className="mb-3 w-[calc(100vw-24px)] xs:w-[380px] sm:w-[400px] h-[580px] max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    
                    {/* Royal Blue Header */}
                    <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border-2 border-white/20 flex-shrink-0">
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                                    Renters Assistant
                                </h3>
                                <p className="text-[11px] sm:text-xs text-blue-100/90 font-medium truncate">
                                    We typically reply in a few seconds
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleClearHistory}
                                className="w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                                title="Reset conversation"
                            >
                                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Body with Date Header */}
                    <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 bg-slate-50/60 text-sm">
                        
                        {/* Centered Date Badge */}
                        <div className="flex justify-center my-1">
                            <span className="text-[11px] font-semibold text-slate-400 bg-white border border-slate-200/60 px-3 py-1 rounded-full shadow-2xs">
                                Today
                            </span>
                        </div>

                        {messages.map((msg, index) => (
                            <div key={msg.id} className="space-y-3">
                                <div
                                    className={`flex items-start gap-2.5 ${
                                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                                >
                                    {/* Bot Avatar Icon */}
                                    {msg.sender === "ai" && (
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-blue-600 shadow-2xs flex-shrink-0 mt-0.5">
                                            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[82%]`}>
                                        {/* Message Bubble */}
                                        <div
                                            className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                                                msg.sender === "user"
                                                    ? "bg-blue-600 text-white rounded-tr-none"
                                                    : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                            
                                            {/* User Message Footer inside blue bubble */}
                                            {msg.sender === "user" && (
                                                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-blue-100/90 font-medium">
                                                    <span>{msg.timestamp || "Just now"}</span>
                                                    <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                                                </div>
                                            )}
                                        </div>

                                        {/* AI Timestamp below bubble */}
                                        {msg.sender === "ai" && (
                                            <span className="text-[10px] font-medium text-slate-400 mt-1 ml-1">
                                                {msg.timestamp || "Just now"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Show Quick Services Buttons under the initial welcome message */}
                                {index === 0 && (
                                    <div className="pl-0 sm:pl-9 grid grid-cols-2 gap-2 w-full">
                                        {QUICK_SERVICES.map((item, qIdx) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={qIdx}
                                                    onClick={() => handleSend(item.prompt)}
                                                    className="flex items-center gap-2 p-2 sm:p-2.5 bg-white border border-blue-500/80 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold shadow-2xs transition-all text-left min-w-0"
                                                >
                                                    <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                    <span className="truncate">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Inline Property Cards */}
                                {msg.properties && msg.properties.length > 0 && (
                                    <div className="pl-0 sm:pl-9 space-y-2 mt-2 w-full">
                                        {msg.properties.map((prop) => (
                                            <div
                                                key={prop.id}
                                                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 shadow-2xs transition-all flex items-center gap-3 group min-w-0"
                                            >
                                                <img
                                                    src={prop.image}
                                                    alt={prop.title}
                                                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">
                                                        {prop.title}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                                        <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                                        <span className="truncate">{prop.location} • {prop.bedrooms ? `${prop.bedrooms}BHK` : prop.category}</span>
                                                    </p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="font-bold text-xs text-blue-600">
                                                            {prop.price}
                                                        </span>
                                                        <Link
                                                            to={prop.listingType === "rent" ? `/rent/${prop.slug || prop.id}` : `/buy/${prop.slug || prop.id}`}
                                                            onClick={() => setIsOpen(false)}
                                                            className="text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded-md flex items-center gap-0.5 transition-colors flex-shrink-0"
                                                        >
                                                            View
                                                            <ChevronRight className="w-3 h-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-slate-500 text-xs pl-0 sm:pl-9 bg-white border border-slate-200 p-2.5 rounded-2xl w-fit shadow-2xs">
                                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                                <span className="font-medium text-slate-600 ml-1">Renters AI is thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Bottom Floating Input & Powered Footer */}
                    <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm transition-colors">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Type your message..."
                                className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none border-none focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none focus-visible:ring-0 py-1.5"
                            />
                            <button
                                type="button"
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-sm flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Powered by Renters AI footer */}
                        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium pt-0.5">
                            <Sparkles className="w-3 h-3 text-blue-600 fill-blue-600" />
                            <span>Powered by Renters AI</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Sparkler Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative flex items-center justify-center rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 w-12 h-12 sm:w-auto sm:px-5 sm:py-3 gap-2.5"
                    title="Renters AI Assistant"
                >
                    <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                        <Building2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="hidden sm:inline text-sm font-bold tracking-wide">Renters AI</span>
                    <span className="absolute -top-0.5 -right-0.5 sm:relative sm:top-auto sm:right-auto flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                    </span>
                </button>
            )}
        </div>
    );
}
