import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../theme/useTheme";
import VerifiedBadge from "../ui/VerifiedBadge";

type Conversation = {
  _id: string;
  participants: Array<{ _id: string; name: string; avatar?: string; isOnline?: boolean }>;
  lastMessage?: { text: string; createdAt: string; sender: string };
  lastActivityAt?: string;
  unreadCount?: any;
  property?: { title: string; _id: string };
};

interface ConversationListItemProps {
  item: Conversation;
  currentUserId: string;
  onPress: (item: Conversation) => void;
  getUnreadCount: (item: Conversation) => number;
  formatTime: (dateStr?: string) => string;
  getOtherParticipant: (item: Conversation) => any;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  item,
  currentUserId,
  onPress,
  getUnreadCount,
  formatTime,
  getOtherParticipant,
}) => {
  const { colors } = useTheme();
  const other = getOtherParticipant(item);
  const unread = getUnreadCount(item);
  const initial = (other?.name || "?")[0]?.toUpperCase();
  const isOnline = other?.isOnline || false;

  return (
    <TouchableOpacity
      style={styles.convItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: unread > 0 ? colors.primary : colors.textSecondary },
          ]}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        {isOnline && (
          <View
            style={[
              styles.onlineDot,
              { borderColor: colors.background, backgroundColor: "#10b981" },
            ]}
          />
        )}
      </View>
      <View style={styles.convBody}>
        <View style={styles.convHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
            <Text
              style={[
                styles.convName,
                { color: colors.textPrimary, marginRight: 2 },
                unread > 0 && { fontWeight: "700" },
              ]}
              numberOfLines={1}
            >
              {other?.name || "Unknown User"}
            </Text>
            {other?.isVerified && <VerifiedBadge size={14} />}
          </View>
          <Text style={[styles.convTime, { color: colors.textSecondary }]}>
            {formatTime(item.lastActivityAt || item.lastMessage?.createdAt)}
          </Text>
        </View>
        {item.property?.title && (
          <Text style={[styles.convProperty, { color: colors.textSecondary }]} numberOfLines={1}>
            🏠 {item.property.title}
          </Text>
        )}
        <View style={styles.convFooter}>
          <Text
            style={[
              styles.convLastMsg,
              { color: colors.textSecondary },
              unread > 0 && { color: colors.textPrimary, fontWeight: "600" },
            ]}
            numberOfLines={1}
          >
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

const styles = StyleSheet.create({
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  convBody: {
    flex: 1,
  },
  convHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  convName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  convTime: {
    fontSize: 12,
  },
  convProperty: {
    fontSize: 12,
    marginBottom: 2,
  },
  convFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  convLastMsg: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default ConversationListItem;
