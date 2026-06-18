import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar, Clock, User, ArrowLeft, AlertCircle, CheckCircle, Trash2, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { bookingService, VisitBooking } from "../../features/bookings/services/bookingService";
import AppButton from "../../components/ui/AppButton";
import AnimatedPressable from "../../components/ui/AnimatedPressable";
import Badge from "../../components/ui/Badge";
import type { RootStackParamList } from "../../navigation/types";
import { radius, spacing } from "@shared/theme/tokens";
import { env } from "../../config/env";

export default function MyVisitsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // States
  const [bookings, setBookings] = useState<VisitBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<VisitBooking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getUserBookings();
      setBookings(data.tenant || []);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelPress = (booking: VisitBooking) => {
    setCancellingBooking(booking);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setCancelLoading(true);
    try {
      await bookingService.updateBookingStatus(cancellingBooking._id, "cancelled");
      Alert.alert("Visit Cancelled", "Your visit viewing request has been cancelled.");
      setCancellingBooking(null);
      fetchBookings();
    } catch (err: any) {
      console.error("Error cancelling booking:", err);
      Alert.alert("Cancellation Failed", err.message || "Could not cancel booking. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleLeaseAction = async (booking: VisitBooking) => {
    const propertyId = booking.propertyId?._id || booking.propertyId;
    const tenantId = booking.tenantId?._id || booking.tenantId;
    
    try {
      const res = await fetch(`${env.apiBaseUrl}/api/leases/property/${propertyId}/tenant/${tenantId}`);
      const json = await res.json();
      if (json.success && json.data) {
        navigation.navigate("LeaseDraft", { leaseId: json.data._id });
      } else {
        Alert.alert(
          "No Lease Agreement",
          "The landlord has not drafted a lease agreement yet. Please message them directly to request a lease draft.",
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      console.error("Lease query error:", err);
      Alert.alert("Error", "Failed to retrieve lease agreement details.");
    }
  };

  const formatDateTime = (startStr: string) => {
    const date = new Date(startStr);
    return {
      dateStr: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      timeStr: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  // Split bookings
  const upcomingBookings = bookings.filter((b) => b.status === "pending" || b.status === "confirmed");
  const pastBookings = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your visits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <AlertCircle size={36} color={colors.error} style={{ marginBottom: 12 }} />
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Error Loading Visits</Text>
        <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{error}</Text>
        <AppButton onPress={fetchBookings} style={{ marginTop: 16 }}>Retry</AppButton>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Visits</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Properties you scheduled viewings for
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Upcoming Visits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Visits</Text>
          {upcomingBookings.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Calendar size={32} color={colors.textSecondary} style={{ marginBottom: 8, opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No upcoming visits scheduled</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Explore properties and request a visit slot directly from the property details.
              </Text>
            </View>
          ) : (
            upcomingBookings.map((item) => {
              const { dateStr, timeStr } = formatDateTime(item.slotStart);
              const property = item.propertyId || {};
              const owner = item.ownerId || {};
              const photoUrl = property.photos && property.photos[0] ? property.photos[0] : "";

              return (
                <View
                  key={item._id}
                  style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.bookingCardTop}>
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={styles.propertyThumb} />
                    ) : (
                      <View style={[styles.placeholderThumb, { backgroundColor: colors.input }]}>
                        <Calendar size={18} color={colors.textSecondary} />
                      </View>
                    )}

                    <View style={styles.propertyDetails}>
                      <View style={styles.titleBadgeRow}>
                        <Text style={[styles.propertyTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {property.title || "Property"}
                        </Text>
                        <Badge
                          variant={item.status === "confirmed" ? "success" : "warning"}
                        >
                          {item.status}
                        </Badge>
                      </View>

                      <View style={styles.dateTimeRow}>
                        <Calendar size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.dateTimeText, { color: colors.textPrimary }]}>{dateStr}</Text>
                      </View>
                      <View style={styles.dateTimeRow}>
                        <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{timeStr}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Owner Contact section */}
                  <View style={[styles.ownerContactBar, { backgroundColor: colors.input, borderTopColor: colors.border }]}>
                    <View style={styles.ownerInfo}>
                      {owner.avatar ? (
                        <Image source={{ uri: owner.avatar }} style={styles.ownerAvatar} />
                      ) : (
                        <View style={[styles.ownerAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                          <Text style={styles.ownerAvatarText}>{owner.name?.charAt(0) || "O"}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={[styles.ownerName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {owner.name}
                        </Text>
                        <Text style={[styles.ownerLabel, { color: colors.textSecondary }]}>Landlord</Text>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      {item.status === "confirmed" && (
                        <AnimatedPressable
                          style={[styles.smallBtn, { backgroundColor: `${colors.primary}12`, borderColor: colors.primary }]}
                          onPress={() => handleLeaseAction(item)}
                        >
                          <Text style={[styles.smallBtnText, { color: colors.primary }]}>Lease</Text>
                        </AnimatedPressable>
                      )}
                      <AnimatedPressable
                        style={[styles.smallBtn, { backgroundColor: `${colors.error}12`, borderColor: colors.error }]}
                        onPress={() => handleCancelPress(item)}
                      >
                        <Text style={[styles.smallBtnText, { color: colors.error }]}>Cancel</Text>
                      </AnimatedPressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Past & Cancelled Visits (Collapsible) */}
        <View style={[styles.collapsibleBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable style={styles.collapsibleHeader} onPress={() => setShowPast(!showPast)}>
            <Text style={[styles.collapsibleTitle, { color: colors.textSecondary }]}>
              Past & Cancelled Visits ({pastBookings.length})
            </Text>
            {showPast ? (
              <ChevronUp size={18} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={18} color={colors.textSecondary} />
            )}
          </Pressable>

          {showPast && (
            <View style={[styles.collapsibleBody, { borderTopColor: colors.border }]}>
              {pastBookings.length === 0 ? (
                <Text style={[styles.emptyPastText, { color: colors.textSecondary }]}>
                  No past viewing records.
                </Text>
              ) : (
                pastBookings.map((item) => {
                  const { dateStr, timeStr } = formatDateTime(item.slotStart);
                  const property = item.propertyId || {};
                  return (
                    <View key={item._id} style={[styles.pastRow, { borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pastPropertyTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {property.title || "Property Listing"}
                        </Text>
                        <Text style={[styles.pastTimeText, { color: colors.textSecondary }]}>
                          {dateStr} @ {timeStr}
                        </Text>
                      </View>
                      <Badge variant={item.status === "completed" ? "secondary" : "destructive"}>
                        {item.status}
                      </Badge>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <Modal visible={!!cancellingBooking} transparent={true} animationType="fade" onRequestClose={() => setCancellingBooking(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalAlertHeader}>
                <ShieldAlert size={28} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.modalAlertTitle, { color: colors.textPrimary }]}>Cancel Visit</Text>
              </View>
              <Text style={[styles.modalAlertText, { color: colors.textSecondary }]}>
                Are you sure you want to cancel your visit viewing for{"\n"}
                <Text style={{ fontWeight: "700", color: colors.textPrimary }}>
                  {cancellingBooking.propertyId?.title}
                </Text>
                ? The landlord will be notified.
              </Text>
              <View style={styles.modalAlertActions}>
                <Pressable
                  style={[styles.alertButton, { backgroundColor: colors.input }]}
                  onPress={() => setCancellingBooking(null)}
                >
                  <Text style={[styles.alertBtnText, { color: colors.textPrimary }]}>Keep Booking</Text>
                </Pressable>
                <Pressable
                  disabled={cancelLoading}
                  style={[styles.alertButton, { backgroundColor: colors.error }]}
                  onPress={handleConfirmCancel}
                >
                  {cancelLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={[styles.alertBtnText, { color: "#ffffff" }]}>Yes, Cancel</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    marginTop: spacing.sm,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContainer: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: spacing.sm + 2,
    letterSpacing: -0.2,
  },
  emptyCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
  bookingCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  bookingCardTop: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "center",
  },
  propertyThumb: {
    width: 60,
    height: 60,
    borderRadius: radius.md + 2,
    marginRight: spacing.md,
  },
  placeholderThumb: {
    width: 60,
    height: 60,
    borderRadius: radius.md + 2,
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  propertyDetails: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  propertyTitle: {
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
    marginRight: 6,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  dateTimeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ownerContactBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  ownerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  ownerAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerAvatarText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  ownerName: {
    fontSize: 11,
    fontWeight: "700",
  },
  ownerLabel: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 10,
    fontWeight: "800",
  },
  collapsibleBlock: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  collapsibleTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  collapsibleBody: {
    borderTopWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyPastText: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
  pastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.sm,
    borderBottomWidth: 0.8,
    marginBottom: spacing.xs,
  },
  pastPropertyTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  pastTimeText: {
    fontSize: 10,
    marginTop: 2,
  },
  // Modal dialog
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.md + 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  modalAlertTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalAlertText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  modalAlertActions: {
    flexDirection: "row",
    gap: 12,
  },
  alertButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.md + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: 12,
    textAlign: "center",
  },
});
