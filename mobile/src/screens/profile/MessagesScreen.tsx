import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  RefreshControl,
  Alert,
  Image,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Send, MessageSquare, Trash2, RefreshCw, ChevronLeft } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import { messageService } from "../../features/messages/services/messageService";

type Conversation = {
  _id: string;
  participants: Array<{ _id: string; name: string; avatar?: string }>;
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
  const flatRef = useRef<FlatList>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setConvsLoading(true);
      const result = await messageService.getConversations();
      const convs = result?.data?.conversations || result?.data || result?.conversations || [];
      setConversations(Array.isArray(convs) ? convs : []);
    } catch(e) {
      console.error("Failed to load conversations", e);
    } finally {
      setConvsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Auto-select if navigated with conversationId
  useEffect(() => {
    const convId = route.params?.conversationId;
    if (!convId) return;

    // Wait until initial load is finished so we don't accidentally fetch multiple times
    if (convsLoading) return;

    // Check if it's in our local loaded list first
    const target = conversations.find(c => c._id === convId || (c as any).id === convId);
    if (target) {
      openConversation(target);
    } else {
      // It's not in our list (could be a newly created conversation from property detail) or list is empty
      // Let's fetch it directly
      messageService.getConversation(convId).then(result => {
        const convData = result?.data?.conversation || result?.conversation;
        if (convData) {
          // Add to local list and open
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
      const result = await messageService.getConversation(conv._id || (conv as any).id);
      const msgs = result?.data?.messages || result?.messages || [];
      setMessages(Array.isArray(msgs) ? msgs : []);
      // Mark as read
      const convId = conv._id || (conv as any).id;
      if (convId) {
        await messageService.markAsRead(convId).catch(() => {});
      }
      // Update local unread count
      setConversations(prev => prev.map(c =>
        c._id === convId || (c as any).id === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch(e) {
      console.error("Failed to load messages", e);
    } finally {
      setMsgsLoading(false);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !selectedConv) return;
    const text = inputText.trim();
    setInputText("");

    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: currentUserId,
      text,
      createdAt: new Date().toISOString(),
      read: false,
      pending: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    setSending(true);
    try {
      const convId = selectedConv._id || (selectedConv as any).id;
      const result = await messageService.sendMessage(convId, text);
      const realMsg = result?.data?.message || result?.message || result;
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? { ...realMsg, pending: false } : m));
      setConversations(prev => prev.map(c =>
        c._id === convId || (c as any).id === convId
          ? { ...c, lastMessage: { text, sender: currentUserId, createdAt: new Date().toISOString() }, lastActivityAt: new Date().toISOString() }
          : c
      ).sort((a, b) => new Date(b.lastActivityAt || 0).getTime() - new Date(a.lastActivityAt || 0).getTime()));
    } catch(e) {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }, [inputText, selectedConv, currentUserId]);

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
          } catch(e) {
            Alert.alert("Error", "Failed to delete conversation.");
          }
        }
      }
    ]);
  }, [selectedConv]);

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants?.find(p => (p._id || p) !== currentUserId) || conv.participants?.[0];
  };

  const getSenderId = (msg: Message) =>
    typeof msg.sender === "object" ? msg.sender._id : msg.sender;

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

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item);
    const unread = getUnreadCount(item);
    const initial = (other?.name || "?")[0]?.toUpperCase();

    return (
      <TouchableOpacity style={styles.convItem} onPress={() => openConversation(item)} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: unread > 0 ? colors.primary : colors.textSecondary }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.convBody}>
          <View style={styles.convHeader}>
            <Text style={[styles.convName, unread > 0 && { color: colors.textPrimary, fontWeight: '700' }]} numberOfLines={1}>
              {other?.name || "Unknown User"}
            </Text>
            <Text style={styles.convTime}>{formatTime(item.lastActivityAt || item.lastMessage?.createdAt)}</Text>
          </View>
          {item.property?.title && (
            <Text style={styles.convProperty} numberOfLines={1}>🏠 {item.property.title}</Text>
          )}
          <View style={styles.convFooter}>
            <Text style={[styles.convLastMsg, unread > 0 && { color: colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
              {item.lastMessage?.text || "No messages yet"}
            </Text>
            {unread > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMine = getSenderId(item) === currentUserId;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
        <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleOther, item.pending && { opacity: 0.6 }]}>
          <Text style={[styles.msgText, { color: isMine ? "#fff" : colors.textPrimary }]}>{item.text}</Text>
          <Text style={[styles.msgTime, { color: isMine ? "rgba(255,255,255,0.7)" : colors.textSecondary }]}>
            {formatTime(item.createdAt)}{item.pending ? " ·· sending" : ""}
          </Text>
        </View>
      </View>
    );
  };

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <MessageSquare size={22} color={colors.primary} />
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
            renderItem={renderConversationItem}
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
    );
  }

  // ── CHAT VIEW ──
  const otherParticipant = selectedConv ? getOtherParticipant(selectedConv) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Chat Header */}
      <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { setView("list"); setSelectedConv(null); setMessages([]); }} style={styles.backBtn}>
          <ChevronLeft size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18 }]}>
          <Text style={styles.avatarText}>{(otherParticipant?.name || "?")[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.chatTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {otherParticipant?.name || "Unknown User"}
          </Text>
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {msgsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => item._id || (item as any).id}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ color: colors.textSecondary, marginTop: 40 }}>No messages yet. Say hello! 👋</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.msgInput, { backgroundColor: colors.input, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !inputText.trim()}
            style={[styles.sendBtn, { backgroundColor: !inputText.trim() ? colors.border : colors.primary }]}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    backgroundColor: `${colors.primary}20`,
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

  // Conversation list
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  convBody: { flex: 1 },
  convHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  convName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, flex: 1, marginRight: 8 },
  convTime: { fontSize: 12, color: colors.textSecondary },
  convProperty: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  convFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convLastMsg: { fontSize: 13, color: colors.textSecondary, flex: 1, marginRight: 8 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

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
  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 8 },
  msgRowMine: { alignItems: "flex-end" },
  msgRowOther: { alignItems: "flex-start" },
  msgBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgText: { fontSize: 15, lineHeight: 21 },
  msgTime: { fontSize: 11, marginTop: 4, alignSelf: "flex-end" },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  msgInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
