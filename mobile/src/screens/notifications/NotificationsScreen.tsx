import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Bell, CheckCheck, RefreshCw, ArrowLeft, MessageSquare, AlertCircle, Inbox,
} from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import ProtectedScreen from "../../components/auth/ProtectedScreen";
import { notificationService } from "../../features/notifications/services/notificationService";

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: { conversationId?: string };
};

const NOTIFICATION_ICONS: Record<string, string> = {
  message: "💬",
  property: "🏠",
  wishlist: "❤️",
  system: "🔔",
  default: "🔔",
};

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { user, isGuest, logout } = useAuth();
  const navigation = useNavigation<any>();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  const load = useCallback(async (p = 1, unreadOnly = false, append = false) => {
    // Don't load notifications if user is not authenticated
    if (isGuest || !user) return;
    
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const data = await notificationService.getNotifications({ page: p, unreadOnly });
      // Safely extract notifications array — API may return different shapes
      let raw: Notification[] = [];
      if (Array.isArray(data)) {
        raw = data;
      } else if (data && Array.isArray(data.notifications)) {
        raw = data.notifications;
      } else if (data && Array.isArray(data.data)) {
        raw = data.data;
      }
      const pagination = data?.pagination || {};
      
      setNotifications(prev => append ? [...(Array.isArray(prev) ? prev : []), ...raw] : raw);
      setHasMore(pagination.hasMore ?? (raw.length === 20));
      setPage(p);
    } catch(e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [isGuest, user]);

  useEffect(() => { load(1, filter === "unread"); }, [load, filter]);

  const handleFilterChange = (f: "all" | "unread") => {
    setFilter(f);
    setPage(1);
    load(1, f === "unread");
  };

  const handleMarkAsRead = useCallback(async (notification: Notification) => {
    if (notification.read || isGuest || !user) return;
    try {
      await notificationService.markAsRead(notification._id);
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
      );
    } catch(e) {}
  }, [isGuest, user]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (isGuest || !user) return;
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch(e) {
      Alert.alert("Error", "Failed to mark all as read.");
    }
  }, [isGuest, user]);

  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification);
    if (notification.type === "message" && notification.data?.conversationId) {
      navigation.navigate("Messages", { conversationId: notification.data.conversationId });
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    load(nextPage, filter === "unread", true);
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const filteredNotifications = filter === "unread"
    ? safeNotifications.filter(n => !n.read)
    : safeNotifications;

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Notifications</Text>
        </View>
        <View style={styles.center}>
          <Bell size={56} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: 16 }]}>Sign in required</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Sign in to see your notifications
          </Text>
          <TouchableOpacity
            onPress={async () => await logout()}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: Notification }) => {
    const icon = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.default;
    return (
      <TouchableOpacity
        style={[styles.notifItem, !item.read && { backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` }]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.notifIconWrap, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={[styles.notifTitle, { color: colors.textPrimary, fontWeight: item.read ? "600" : "800" }]} numberOfLines={1}>
              {item.title || item.type}
            </Text>
            <Text style={[styles.notifTime, { color: colors.textSecondary }]}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={[styles.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.message}
          </Text>
          {item.type === "message" && item.data?.conversationId && (
            <Text style={[styles.notifAction, { color: colors.primary }]}>Tap to view conversation →</Text>
          )}
        </View>
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ProtectedScreen 
      requireAuth={true}
      title="Sign In Required"
      message="Please sign in to view your notifications"
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
            <Bell size={22} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[styles.unreadHint, { color: colors.textSecondary }]}>
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={[styles.markAllBtn, { borderColor: colors.border }]}>
              <CheckCheck size={16} color={colors.primary} />
              <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterRow, { borderTopColor: colors.border }]}>
          {(["all", "unread"] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => handleFilterChange(f)}
              style={[styles.filterTab, filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={[styles.filterTabText, { color: filter === f ? "#fff" : colors.textSecondary }]}>
                {f === "all" ? "All" : "Unread"}
              </Text>
              {f === "unread" && unreadCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: filter === "unread" ? "rgba(255,255,255,0.3)" : `${colors.primary}20` }]}>
                  <Text style={[styles.filterBadgeText, { color: filter === "unread" ? "#fff" : colors.primary }]}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading notifications...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.center}>
          <Inbox size={56} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: 16 }]}>
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {filter === "unread"
              ? "You're all caught up! Check back later for updates."
              : "When you receive messages or updates, they'll appear here."}
          </Text>
          {filter === "unread" && notifications.length > 0 && (
            <TouchableOpacity
              onPress={() => handleFilterChange("all")}
              style={[styles.outlineBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.textPrimary }}>View all notifications</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1, filter === "unread"); }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
    </ProtectedScreen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1 },
  headerCard: {
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
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
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  unreadHint: { fontSize: 12, marginTop: 1 },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: { fontSize: 12, fontWeight: "600" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabText: { fontSize: 13, fontWeight: "600" },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 11, fontWeight: "700" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, marginTop: 16, textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center" },
  outlineBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  separator: { height: 1, marginHorizontal: 16 },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifTitle: { fontSize: 14, marginRight: 8, flex: 1 },
  notifMsg: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  notifTime: { fontSize: 11, flexShrink: 0, marginTop: 2 },
  notifAction: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  primaryBtn: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
