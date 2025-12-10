export function MessageBubble({ message, isOwn }) {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className={`flex${isOwn ? "justify-end" : "justify-start"} mb-3`}>
            <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl${isOwn
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-900 rounded-bl-none"
                    }`}
            >
                {message.image && (
                    <img
                        src={message.image}
                        alt="Message attachment"
                        className="w-full rounded-lg mb-2 max-h-64 object-cover"
                    />
                )}

                {message.text && <p className="break-words">{message.text}</p>}

                <p
                    className={`text-xs mt-1${isOwn ? "text-blue-100" : "text-gray-500"
                        }`}
                >
                    {formatTime(message.timestamp)}
                </p>
            </div>
        </div>
    );
}
