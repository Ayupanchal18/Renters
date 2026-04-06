import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  RefreshControl,
  Alert,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Send, MessageSquare, Trash2, ChevronLeft, Paperclip, Smile, X, FileText } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import ProtectedScreen from "../../components/auth/ProtectedScreen";
import { messageService } from "../../features/messages/services/messageService";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Common emojis for quick access
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😉', '😍', '🥰', '😘', '😋', '😎', '🤔', '🤗', '🤩', '😏',
  '😢', '😭', '😤', '😠', '🤯', '😱', '😰', '🥺', '😴', '🤮',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞', '👋', '🙏',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💯', '✨',
  '🔥', '⭐', '🎉', '🎊', '💐', '🏠', '🏡', '🏢', '🔑', '📍'
];

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
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    // Don't load conversations if user is not authenticated
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
    } catch(e) {
      console.error("Failed to load conversations", e);
    } finally {
      setConvsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

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

  const handlePickImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to upload images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (approximate from dimensions if fileSize not available)
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          setUploadError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
          return;
        }

        setSelectedImage(asset);
        setUploadError(null);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setUploadError(null);
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSend = useCallback(async () => {
    if ((!inputText.trim() && !selectedImage) || !selectedConv) return;
    const text = inputText.trim();
    setInputText("");
    const imageToSend = selectedImage;
    setSelectedImage(null);

    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: currentUserId,
      text: text || (imageToSend ? "📷 Image" : ""),
      createdAt: new Date().toISOString(),
      read: false,
      pending: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    // No need to scroll with inverted list - new messages appear at bottom automatically

    setSending(true);
    try {
      const convId = selectedConv._id || (selectedConv as any).id;
      // TODO: Update messageService to handle image uploads
      const result = await messageService.sendMessage(convId, text);
      const realMsg = result?.data?.message || result?.message || result;
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? { ...realMsg, pending: false } : m));
      setConversations(prev => prev.map(c =>
        c._id === convId || (c as any).id === convId
          ? { ...c, lastMessage: { text: text || "📷 Image", sender: currentUserId, createdAt: new Date().toISOString() }, lastActivityAt: new Date().toISOString() }
          : c
      ).sort((a, b) => new Date(b.lastActivityAt || 0).getTime() - new Date(a.lastActivityAt || 0).getTime()));
    } catch(e) {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }, [inputText, selectedImage, selectedConv, currentUserId]);

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

        {/* Input Bar - Always at bottom */}
        <View style={{ backgroundColor: colors.surface }}>
          {/* Upload Error */}
          {uploadError && (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{uploadError}</Text>
              <TouchableOpacity onPress={() => setUploadError(null)}>
                <Text style={[styles.errorDismiss, { color: colors.error }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Image Preview */}
          {selectedImage && (
            <View style={[styles.imagePreview, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {selectedImage.fileName || 'Image'}
                </Text>
                {selectedImage.fileSize && (
                  <Text style={[styles.previewSize, { color: colors.textSecondary }]}>
                    {formatFileSize(selectedImage.fileSize)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={clearImage} style={styles.previewClose}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputBar, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={sending}
              style={styles.iconBtn}
            >
              <Paperclip size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={[styles.msgInput, { backgroundColor: colors.input, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
            />

            <TouchableOpacity
              onPress={() => setShowEmojiPicker(true)}
              disabled={sending}
              style={styles.iconBtn}
            >
              <Smile size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || (!inputText.trim() && !selectedImage)}
              style={[styles.sendBtn, { backgroundColor: (!inputText.trim() && !selectedImage) ? colors.border : colors.primary }]}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Send size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>

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
  msgList: { 
    padding: 16, 
    paddingTop: 8,
  },
  emptyMsgContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scaleY: -1 }], // Flip back the empty state since list is inverted
  },
  msgRow: { marginTop: 8 }, // Changed from marginBottom since list is inverted
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  errorText: { fontSize: 12, flex: 1 },
  errorDismiss: { fontSize: 16, fontWeight: "700", marginLeft: 8 },
  imagePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 13, fontWeight: "600" },
  previewSize: { fontSize: 11, marginTop: 2 },
  previewClose: { padding: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
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
