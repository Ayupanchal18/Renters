import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Sparkles,
  X,
  Send,
  Building2,
  Briefcase,
  MessageSquareText,
  ShieldCheck,
  MoreVertical,
  Paperclip,
  CheckCheck,
  MapPin,
  ChevronRight,
} from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { apiClient } from "../../api/client";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

interface PropertyCardData {
  id: string;
  title: string;
  slug?: string;
  listingType: "rent" | "buy" | string;
  category: string;
  price: string;
  location: string;
  bedrooms?: number;
  image: string;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
  properties?: PropertyCardData[];
}

const QUICK_SERVICES = [
  { icon: Building2, label: "Rent Listings", prompt: "Show available rental properties" },
  { icon: Briefcase, label: "Buy Listings", prompt: "Show properties available for buy" },
  { icon: MessageSquareText, label: "Talk to Sales", prompt: "How can I contact a property manager or landlord?" },
  { icon: ShieldCheck, label: "Deposit Rules", prompt: "What are standard security deposit and lease rules?" },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AiAssistantModal() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [modalVisible, setModalVisible] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Hi there! 👋\nHow can I help you today?",
      timestamp: "10:30 AM",
      properties: [],
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (modalVisible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages, modalVisible]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      timestamp: formatCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post("/api/ai/chat", {
        message: queryText,
        conversationHistory: messages.map((m) => ({
          role: m.sender,
          content: m.text,
        })),
      });

      if (res.data && res.data.success) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: res.data.reply || "Here are matching property options for you:",
          timestamp: formatCurrentTime(),
          properties: res.data.matchedProperties || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(res.data?.message || "Failed to get AI response");
      }
    } catch (err: any) {
      console.error("[Mobile AI Chat Error]:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "I encountered a brief connection issue. Here are some featured properties on Renters!",
          timestamp: formatCurrentTime(),
          properties: [],
        },
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
        properties: [],
      },
    ]);
  };

  const handlePropertyPress = (prop: PropertyCardData) => {
    setModalVisible(false);
    navigation.navigate("PropertyDetail", {
      identifier: prop.slug || prop.id,
      type: (prop.listingType === "buy" ? "buy" : "rent") as "rent" | "buy",
    });
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
        style={styles.fab}
      >
        <View style={styles.fabIconBadge}>
          <Building2 size={16} color="#1d4ed8" />
        </View>
        <Text style={styles.fabText}>Renters AI</Text>
        <View style={styles.onlineDot} />
      </TouchableOpacity>

      {/* Full Modal Drawer */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            {/* Royal Blue Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerLogoContainer}>
                  <Building2 size={20} color="#1d4ed8" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Renters Assistant</Text>
                  <Text style={styles.headerSubtitle}>
                    We typically reply in a few seconds
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleClearHistory}
                  style={styles.headerBtn}
                >
                  <MoreVertical size={18} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.headerBtn}
                >
                  <X size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages Body */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesList}
              contentContainerStyle={{ paddingVertical: 12 }}
            >
              {/* Centered Date Badge */}
              <View style={styles.dateHeaderContainer}>
                <Text style={styles.dateHeaderText}>Today</Text>
              </View>

              {messages.map((msg, index) => (
                <View key={msg.id} style={styles.messageBlock}>
                  <View
                    style={[
                      styles.messageRow,
                      msg.sender === "user" ? styles.userRow : styles.aiRow,
                    ]}
                  >
                    {/* Bot Avatar Badge */}
                    {msg.sender === "ai" && (
                      <View style={styles.aiAvatarBadge}>
                        <Building2 size={14} color="#1d4ed8" />
                      </View>
                    )}

                    <View
                      style={[
                        styles.messageBubbleContainer,
                        msg.sender === "user"
                          ? styles.userBubbleContainer
                          : styles.aiBubbleContainer,
                      ]}
                    >
                      <View
                        style={[
                          styles.bubble,
                          msg.sender === "user" ? styles.userBubble : styles.aiBubble,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            msg.sender === "user" ? styles.userText : styles.aiText,
                          ]}
                        >
                          {msg.text}
                        </Text>

                        {/* User Checkmarks & Timestamp inside blue bubble */}
                        {msg.sender === "user" && (
                          <View style={styles.userBubbleFooter}>
                            <Text style={styles.userTimeText}>
                              {msg.timestamp || "Just now"}
                            </Text>
                            <CheckCheck size={14} color="#bfdbfe" />
                          </View>
                        )}
                      </View>

                      {/* AI Timestamp below bubble */}
                      {msg.sender === "ai" && (
                        <Text style={styles.aiTimestampText}>
                          {msg.timestamp || "Just now"}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* 2x2 Quick Services Buttons under initial welcome message */}
                  {index === 0 && (
                    <View style={styles.quickGridContainer}>
                      {QUICK_SERVICES.map((item, qIdx) => {
                        const IconComponent = item.icon;
                        return (
                          <TouchableOpacity
                            key={qIdx}
                            activeOpacity={0.8}
                            onPress={() => handleSend(item.prompt)}
                            style={styles.quickGridButton}
                          >
                            <IconComponent size={15} color="#1d4ed8" />
                            <Text style={styles.quickGridButtonText} numberOfLines={1}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Inline Property Recommendation Cards */}
                  {msg.properties && msg.properties.length > 0 && (
                    <View style={styles.cardsContainer}>
                      {msg.properties.map((prop) => (
                        <TouchableOpacity
                          key={prop.id}
                          activeOpacity={0.85}
                          onPress={() => handlePropertyPress(prop)}
                          style={styles.propertyCard}
                        >
                          <Image
                            source={{ uri: prop.image }}
                            style={styles.cardImage}
                          />
                          <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle} numberOfLines={1}>
                              {prop.title}
                            </Text>
                            <View style={styles.locationRow}>
                              <MapPin size={10} color="#1d4ed8" />
                              <Text
                                style={styles.cardLocation}
                                numberOfLines={1}
                              >
                                {prop.location} •{" "}
                                {prop.bedrooms ? `${prop.bedrooms}BHK` : prop.category}
                              </Text>
                            </View>
                            <View style={styles.cardBottomRow}>
                              <Text style={styles.cardPrice}>
                                {prop.price}
                              </Text>
                              <View style={styles.viewBadge}>
                                <Text style={styles.viewBadgeText}>View</Text>
                                <ChevronRight size={10} color="#ffffff" />
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1d4ed8" />
                  <Text style={styles.loadingText}>
                    Renters AI is thinking...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Input Bar & Footer */}
            <View style={styles.inputSection}>
              <View style={styles.inputPillContainer}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type your message..."
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={() => handleSend()}
                  disabled={!input.trim() || loading}
                  style={[
                    styles.sendBtn,
                    (!input.trim() || loading) && { opacity: 0.4 },
                  ]}
                >
                  <Send size={15} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Sub-footer */}
              <View style={styles.poweredFooter}>
                <Sparkles size={11} color="#1d4ed8" />
                <Text style={styles.poweredFooterText}>
                  Powered by Renters AI
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#1d4ed8",
    elevation: 8,
    shadowColor: "#1d4ed8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 99,
  },
  fabIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  fabText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "84%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#1d4ed8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#dbeafe",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerBtn: {
    padding: 6,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
  },
  dateHeaderContainer: {
    alignSelf: "center",
    marginVertical: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dateHeaderText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
  messageBlock: {
    marginVertical: 6,
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
  },
  userRow: {
    flexDirection: "row-reverse",
  },
  aiRow: {
    flexDirection: "row",
  },
  aiAvatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#1d4ed8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  messageBubbleContainer: {
    maxWidth: "82%",
  },
  userBubbleContainer: {
    alignItems: "flex-end",
  },
  aiBubbleContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#1d4ed8",
    borderTopRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userText: {
    color: "#ffffff",
  },
  aiText: {
    color: "#1e293b",
  },
  userBubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  userTimeText: {
    fontSize: 9,
    color: "#bfdbfe",
  },
  aiTimestampText: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    marginLeft: 4,
  },
  quickGridContainer: {
    marginLeft: 40,
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickGridButton: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#3b82f6",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  quickGridButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1d4ed8",
    flex: 1,
  },
  cardsContainer: {
    marginLeft: 40,
    marginTop: 8,
    gap: 8,
  },
  propertyCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 12,
  },
  cardImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  cardLocation: {
    fontSize: 11,
    color: "#64748b",
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  viewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  viewBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignSelf: "flex-start",
    marginLeft: 40,
    marginTop: 6,
  },
  loadingText: {
    fontSize: 11,
    color: "#64748b",
    fontStyle: "italic",
  },
  inputSection: {
    padding: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  inputPillContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    paddingVertical: 8,
  },
  attachmentBtn: {
    padding: 6,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1d4ed8",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  poweredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  poweredFooterText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#94a3b8",
  },
});
