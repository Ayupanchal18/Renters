import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, MessageSquare, ChevronLeft, Trash2, X } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import ProtectedScreen from "../../components/auth/ProtectedScreen";
import { messageService } from "../../features/messages/services/messageService";
import { socketService } from "../../features/messages/services/socketService";
import ConversationListItem from "../../components/chat/ConversationListItem";
import MessageBubble from "../../components/chat/MessageBubble";
import MessageComposer from "../../components/chat/MessageComposer";
import VerifiedBadge from "../../components/ui/VerifiedBadge";

// Common emojis for quick access
const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
  "😉", "😍", "🥰", "😘", "😋", "😎", "🤔", "🤗", "🤩", "😏",
  "😢", "😭", "😤", "😠", "🤯", "😱", "😰", "🥺", "😴", "🤮",
  "👍", "👎", "👏", "🙌", "🤝", "💪", "✌️", "🤞", "👋", "🙏",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "💯", "✨",
  "🔥", "⭐", "🎉", "🎊", "💐", "🏠", "🏡", "🏢", "🔑", "📍"
];

type Conversation = {
  _id: string;
  participants: Array<{ _id: string; name: string; avatar?: string; isOnline?: boolean }>;
  lastMessage?: { text: string; createdAt: string; sender: string };
  lastActivityAt?: string;
  unreadCount?: any;
  property?: { title: string; _id: string };
};

type Message = {
  _id: string;
  sender: string | { _id: string; name: string };
  text: string;
  createdAt: string;
  read: boolean;
  pending?: boolean;
  type?: string;
  image?: string;
  file?: {
    originalName?: string;
    filename?: string;
    mimetype?: string;
    size?: number;
    url?: string;
  };
  attachment?: {
    url?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
  };
};

export default function MessagesScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const currentUserId = (user as any)?._id || (user as any)?.id || "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [view, setView] = useState<"list" | "chat">("list");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConvsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setConvsLoading(true);
      const result = await messageService.getConversations();
      const convs = result?.data?.conversations || result?.data || result?.conversations || [];
      setConversations(Array.isArray(convs) ? convs : []);
    } catch (e) {
      console.error("Failed to load conversations", e);
    } finally {
      setConvsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Sync online/offline updates from socket globally
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleUserOnline = (data: { userId: string }) => {
      setConversations(prev =>
        prev.map(c => {
          const updated = c.participants?.map(p =>
            p._id === data.userId ? { ...p, isOnline: true } : p
          );
          return { ...c, participants: updated };
        })
      );
    };

    const handleUserOffline = (data: { userId: string }) => {
      setConversations(prev =>
        prev.map(c => {
          const updated = c.participants?.map(p =>
            p._id === data.userId ? { ...p, isOnline: false } : p
          );
          return { ...c, participants: updated };
        })
      );
    };

    socket.on("user.online", handleUserOnline);
    socket.on("user.offline", handleUserOffline);

    return () => {
      socket.off("user.online", handleUserOnline);
      socket.off("user.offline", handleUserOffline);
    };
  }, [conversations.length]);

  // Handle joining conversation rooms and setting up thread socket listeners
  useEffect(() => {
    if (!selectedConv) return;
    const convId = selectedConv._id || (selectedConv as any).id;

    // Join room
    socketService.joinConversation(convId);

    // Listen for new messages
    const handleNewMsg = (data: { conversationId: string; message: any }) => {
      if (data.conversationId === convId) {
        setMessages(prev => {
          if (prev.some(m => m._id === data.message._id)) return prev;

          // Deduplicate optimistic messages if socket broadcast comes first
          const senderId = typeof data.message.sender === "object" ? data.message.sender._id : data.message.sender;
          if (senderId === currentUserId) {
            const pendingIndex = prev.findIndex(
              m => m.pending === true && (m.text === data.message.text || m.type === data.message.type)
            );
            if (pendingIndex !== -1) {
              const updated = [...prev];
              updated[pendingIndex] = { ...data.message, pending: false };
              return updated;
            }
          }

          return [data.message, ...prev]; // Prepend because FlatList is inverted (index 0 is at bottom)
        });
        // Auto-mark as read on receipt if viewing this thread
        messageService.markAsRead(convId).catch(() => {});
      } else {
        // Increment unread count in conversations list for other conversations
        setConversations(prev =>
          prev.map(c => {
            const cId = c._id || (c as any).id;
            if (cId === data.conversationId) {
              const currentUnread = getUnreadCount(c);
              return {
                ...c,
                unreadCount: currentUnread + 1,
                lastMessage: {
                  text: data.message.text || "📎 Attachment",
                  sender: typeof data.message.sender === "object" ? data.message.sender._id : data.message.sender,
                  createdAt: data.message.createdAt,
                },
                lastActivityAt: data.message.createdAt,
              };
            }
            return c;
          }).sort((a, b) => new Date(b.lastActivityAt || 0).getTime() - new Date(a.lastActivityAt || 0).getTime())
        );
      }
    };

    // Listen for read updates (marks all received messages as read by partner)
    const handleReadUpdate = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === convId && data.userId !== currentUserId) {
        setMessages(prev => prev.map(m => ({ ...m, read: true })));
      }
    };

    // Listen for typing indicator
    const handleUserTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === convId && data.userId !== currentUserId) {
        setIsRecipientTyping(data.isTyping);
      }
    };

    socketService.onMessageNew(handleNewMsg);
    socketService.onMessageReadUpdate(handleReadUpdate);
    socketService.onUserTyping(handleUserTyping);

    return () => {
      socketService.leaveConversation(convId);
      socketService.offMessageNew(handleNewMsg);
      socketService.offMessageReadUpdate(handleReadUpdate);
      socketService.offUserTyping(handleUserTyping);
    };
  }, [selectedConv, currentUserId]);

  // Auto-select if navigated with conversationId
  useEffect(() => {
    const convId = route.params?.conversationId;
    if (!convId) return;

    if (convsLoading) return;

    const target = conversations.find(c => c._id === convId || (c as any).id === convId);
    if (target) {
      openConversation(target);
    } else {
      messageService.getConversation(convId).then(result => {
        const convData = result?.data?.conversation || result?.conversation;
        if (convData) {
          setConversations(prev => {
            if (prev.find(c => c._id === convId)) return prev;
            return [convData, ...prev];
          });
          openConversation(convData);
        }
      }).catch(e => console.error("Could not fetch new conversation", e));
    }
  }, [route.params?.conversationId, conversations.length, convsLoading]);

  const openConversation = useCallback(async (conv: Conversation) => {
    setSelectedConv(conv);
    setView("chat");
    setMsgsLoading(true);
    try {
      const convId = conv._id || (conv as any).id;
      const result = await messageService.getConversation(convId);
      const msgs = result?.data?.messages || result?.messages || [];
      // Reverse messages list because FlatList is inverted (newest at index 0, oldest at index N)
      setMessages(Array.isArray(msgs) ? [...msgs].reverse() : []);

      // Mark as read
      if (convId) {
        await messageService.markAsRead(convId).catch(() => {});
      }
      // Reset local unread count
      setConversations(prev => prev.map(c =>
        c._id === convId || (c as any).id === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      setMsgsLoading(false);
    }
  }, []);

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!selectedConv) return;
    const convId = selectedConv._id || (selectedConv as any).id;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.sendTypingStart(convId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketService.sendTypingStop(convId);
    }, 2000);
  };

  const handleSend = useCallback(async () => {
    if ((!inputText.trim() && !selectedFile) || !selectedConv) return;
    const text = inputText.trim();
    setInputText("");
    const fileToSend = selectedFile;
    setSelectedFile(null);

    // Stop typing indicator on send
    const convId = selectedConv._id || (selectedConv as any).id;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.sendTypingStop(convId);
    }

    // Create optimistic message
    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: currentUserId,
      text: text || (fileToSend ? "📷 Attachment" : ""),
      createdAt: new Date().toISOString(),
      read: false,
      pending: true,
      type: fileToSend?.isImage ? "image" : (fileToSend ? "file" : "text"),
    };

    if (fileToSend) {
      if (fileToSend.isImage) {
        tempMsg.image = fileToSend.uri;
      } else {
        tempMsg.file = {
          originalName: fileToSend.fileName,
          filename: fileToSend.fileName,
          mimetype: fileToSend.mimeType,
          size: fileToSend.fileSize,
          url: fileToSend.uri,
        };
      }
    }

    // Prepend to messages since FlatList is inverted
    setMessages(prev => [tempMsg, ...prev]);
    setSending(true);

    try {
      const result = await messageService.sendMessage(convId, text, fileToSend);
      const realMsg = result?.data?.message || result?.message || result;
      setMessages(prev => {
        // If the socket listener already inserted/replaced this message, remove the tempMsg
        if (prev.some(m => m._id === realMsg._id)) {
          return prev.filter(m => m._id !== tempMsg._id);
        }
        return prev.map(m => m._id === tempMsg._id ? { ...realMsg, pending: false } : m);
      });

      // Update last message preview in conversations list
      setConversations(prev => prev.map(c =>
        c._id === convId || (c as any).id === convId
          ? {
              ...c,
              lastMessage: {
                text: text || (fileToSend ? "📎 Attachment" : ""),
                sender: currentUserId,
                createdAt: new Date().toISOString(),
              },
              lastActivityAt: new Date().toISOString(),
            }
          : c
      ).sort((a, b) => new Date(b.lastActivityAt || 0).getTime() - new Date(a.lastActivityAt || 0).getTime()));
    } catch (e) {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }, [inputText, selectedFile, selectedConv, currentUserId]);

  const handleDeleteConversation = useCallback(async () => {
    if (!selectedConv) return;
    Alert.alert("Delete Conversation", "Are you sure you want to delete this conversation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            const convId = selectedConv._id || (selectedConv as any).id;
            await messageService.deleteConversation(convId);
            setConversations(prev => prev.filter(c => c._id !== convId && (c as any).id !== convId));
            setSelectedConv(null);
            setMessages([]);
            setView("list");
          } catch (e) {
            Alert.alert("Error", "Failed to delete conversation.");
          }
        }
      }
    ]);
  }, [selectedConv]);

  const getOtherParticipant = (conv: Conversation) => {
    if (!conv || !conv.participants) return null;
    const currentIdStr = String(currentUserId).trim().toLowerCase();
    const other = conv.participants.find(p => {
      if (!p) return false;
      const pId = typeof p === "object" ? (p._id || (p as any).id) : p;
      return String(pId).trim().toLowerCase() !== currentIdStr;
    });
    return other || conv.participants[0];
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString();
  };

  const getUnreadCount = (conv: Conversation) => {
    const uc = conv.unreadCount;
    if (!uc) return 0;
    if (typeof uc === "object") return uc[currentUserId] || 0;
    return uc;
  };

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <ProtectedScreen 
        requireAuth={true}
        title="Sign In Required"
        message="Please sign in to access your messages"
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
              <MessageSquare size={22} color="#ffffff" />
            </View>
            <Text style={styles.pageTitle}>Messages</Text>
          </View>

          {convsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading conversations...</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.center}>
              <MessageSquare size={56} color={colors.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No conversations yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Contact a property owner to start chatting
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              renderItem={({ item }) => (
                <ConversationListItem
                  item={item}
                  currentUserId={currentUserId}
                  onPress={openConversation}
                  getUnreadCount={getUnreadCount}
                  formatTime={formatTime}
                  getOtherParticipant={getOtherParticipant}
                />
              )}
              keyExtractor={item => item._id || (item as any).id}
              contentContainerStyle={{ paddingBottom: 32 }}
              ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); loadConversations(); }}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          )}
        </SafeAreaView>
      </ProtectedScreen>
    );
  }

  // ── CHAT VIEW ──
  const otherParticipant = selectedConv ? getOtherParticipant(selectedConv) : null;

  return (
    <ProtectedScreen 
      requireAuth={true}
      title="Sign In Required"
      message="Please sign in to access your messages"
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Chat Header */}
          <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setView("list"); setSelectedConv(null); setMessages([]); }} style={styles.backBtn}>
              <ChevronLeft size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.avatar, { backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18 }]}>
              <Text style={styles.avatarText}>{(otherParticipant?.name || "?")[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.chatTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {otherParticipant?.name || "Unknown User"}
                </Text>
                {(otherParticipant as any)?.isVerified && <VerifiedBadge size={16} />}
              </View>
              {selectedConv?.property?.title && (
                <Text style={[styles.chatSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  🏠 {selectedConv.property.title}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleDeleteConversation} style={{ padding: 8 }}>
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          {msgsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              renderItem={({ item }) => (
                <MessageBubble
                  item={item}
                  currentUserId={currentUserId}
                  formatTime={formatTime}
                />
              )}
              keyExtractor={item => item._id || (item as any).id}
              inverted
              contentContainerStyle={styles.msgList}
              style={{ flex: 1 }}
              ListEmptyComponent={
                <View style={styles.emptyMsgContainer}>
                  <Text style={{ color: colors.textSecondary }}>No messages yet. Say hello! 👋</Text>
                </View>
              }
            />
          )}

          {/* Recipient Typing Indicator */}
          {isRecipientTyping && (
            <View style={[styles.typingContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                {otherParticipant?.name || "Someone"} is typing...
              </Text>
            </View>
          )}

          {/* Message Composer */}
          <MessageComposer
            inputText={inputText}
            setInputText={handleTyping}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            sending={sending}
            onSend={handleSend}
            onEmojiPress={() => setShowEmojiPicker(true)}
          />

          {/* Emoji Picker Modal */}
          <Modal
            visible={showEmojiPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowEmojiPicker(false)}
          >
            <TouchableOpacity
              style={styles.emojiModalOverlay}
              activeOpacity={1}
              onPress={() => setShowEmojiPicker(false)}
            >
              <View style={[styles.emojiPicker, { backgroundColor: colors.surface }]}>
                <View style={styles.emojiHeader}>
                  <Text style={[styles.emojiTitle, { color: colors.textPrimary }]}>Select Emoji</Text>
                  <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                    <X size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.emojiGrid}>
                  {EMOJI_LIST.map((emoji, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleEmojiSelect(emoji)}
                      style={styles.emojiButton}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ProtectedScreen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center" },
  separator: { height: 1, marginHorizontal: 16 },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },

  // Chat
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: colors.surface,
    gap: 6,
  },
  chatTitle: { fontSize: 16, fontWeight: "700" },
  chatSubtitle: { fontSize: 12, marginTop: 1 },
  msgList: { 
    padding: 16, 
    paddingTop: 8,
  },
  emptyMsgContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    transform: Platform.OS === "android" ? [{ rotate: "180deg" }] : [{ scaleY: -1 }],
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 12,
    fontStyle: "italic",
  },

  // Emoji picker
  emojiModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  emojiPicker: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: "60%",
  },
  emojiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  emojiTitle: { fontSize: 18, fontWeight: "700" },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 8,
  },
  emojiButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 28 },
});
