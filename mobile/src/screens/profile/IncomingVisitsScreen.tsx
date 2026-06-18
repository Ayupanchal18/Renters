import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar, Clock, User, Mail, Phone, ArrowLeft, AlertCircle, CheckCircle, Check, X, Info, FileText } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { bookingService, VisitBooking } from "../../features/bookings/services/bookingService";
import AppButton from "../../components/ui/AppButton";
import AnimatedPressable from "../../components/ui/AnimatedPressable";
import Badge from "../../components/ui/Badge";
import type { RootStackParamList } from "../../navigation/types";
import { radius, spacing } from "@shared/theme/tokens";
import { env } from "../../config/env";

export default function IncomingVisitsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // States
  const [bookings, setBookings] = useState<VisitBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<VisitBooking | null>(null);
  const [checkingLease, setCheckingLease] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getUserBookings();
      setBookings(data.owner || []);
    } catch (err: any) {
      console.error("Error fetching incoming bookings:", err);
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (bookingId: string, newStatus: "confirmed" | "cancelled") => {
    setActionLoadingId(bookingId);
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      Alert.alert(
        "Status Updated",
        `Booking viewing request has been ${newStatus === "confirmed" ? "approved" : "declined"} successfully.`
      );
      fetchBookings();
    } catch (err: any) {
      console.error("Error updating booking status:", err);
      Alert.alert("Action Failed", err.message || "Could not update booking status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLeaseAction = async (booking: VisitBooking) => {
    setSelectedBooking(null);
    setCheckingLease(true);
    const propertyId = booking.propertyId?._id || booking.propertyId;
    const tenantId = booking.tenantId?._id || booking.tenantId;

    try {
      // Check if lease exists
      const checkRes = await fetch(`${env.apiBaseUrl}/api/leases/property/${propertyId}/tenant/${tenantId}`);
      const checkJson = await checkRes.json();

      if (checkJson.success && checkJson.data) {
        navigation.navigate("LeaseDraft", { leaseId: checkJson.data._id });
      } else {
        navigation.navigate("LeaseDraft", { propertyId, tenantId });
      }
    } catch (err) {
      console.error("Lease action error:", err);
      Alert.alert("Error", "Failed to process lease agreement action.");
    } finally {
      setCheckingLease(false);
    }
  };

  const formatDateTime = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return {
      dateStr: start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      timeStr: `${start.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })} - ${end.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`,
    };
  };

  // Group pending bookings
  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === "pending"), [bookings]);
  const confirmedBookings = useMemo(() => bookings.filter((b) => b.status === "confirmed"), [bookings]);

  // Group pending bookings by property title
  const pendingGroupedByProperty = useMemo(() => {
    const groups: Record<string, VisitBooking[]> = {};
    pendingBookings.forEach((b) => {
      const propTitle = b.propertyId?.title || "Property Listing";
      if (!groups[propTitle]) groups[propTitle] = [];
      groups[propTitle].push(b);
    });
    return Object.entries(groups);
  }, [pendingBookings]);

  // Calendar logic: generate the next 7 days
  const calendarDays = useMemo(() => {
    const days = [];
    const start = new Date();
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      days.push({
        date: current,
        dateStr: current.toISOString().split("T")[0],
        label: current.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: current.getDate(),
        month: current.toLocaleDateString("en-US", { month: "short" }),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  const getConfirmedBookingsForDay = (dateStr: string) => {
    return confirmedBookings.filter((b) => {
      const bDateStr = new Date(b.slotStart).toISOString().split("T")[0];
      return bDateStr === dateStr;
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading bookings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <AlertCircle size={36} color={colors.error} style={{ marginBottom: 12 }} />
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Error Loading Bookings</Text>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Incoming Visits</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Viewing requests submitted by prospective tenants
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Pending Requests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pending Requests</Text>
          {pendingBookings.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Calendar size={32} color={colors.textSecondary} style={{ marginBottom: 8, opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No pending viewing requests</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                When tenants book active time slots on your property listing pages, they will appear here.
              </Text>
            </View>
          ) : (
            pendingGroupedByProperty.map(([propertyTitle, list]) => (
              <View key={propertyTitle} style={styles.propertyGroup}>
                <Text style={[styles.propertyHeaderTitle, { color: colors.primary }]}>{propertyTitle}</Text>
                {list.map((booking) => {
                  const { dateStr, timeStr } = formatDateTime(booking.slotStart, booking.slotEnd);
                  const tenant = booking.tenantId || {};

                  return (
                    <View
                      key={booking._id}
                      style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      {/* Tenant Row */}
                      <View style={styles.tenantInfoRow}>
                        {tenant.avatar ? (
                          <Image source={{ uri: tenant.avatar }} style={styles.tenantAvatar} />
                        ) : (
                          <View style={[styles.tenantAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.tenantAvatarText}>{tenant.name?.charAt(0) || "T"}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.tenantName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {tenant.name}
                          </Text>
                          <Text style={[styles.tenantEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                            {tenant.email}
                          </Text>
                        </View>
                      </View>

                      {/* Viewing Details summary */}
                      <View style={[styles.detailsBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.detailsRow}>
                          <Calendar size={12} color={colors.primary} style={{ marginRight: 6 }} />
                          <Text style={[styles.detailsText, { color: colors.textPrimary }]}>{dateStr}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                          <Clock size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
                          <Text style={[styles.detailsText, { color: colors.textSecondary }]}>{timeStr}</Text>
                        </View>
                      </View>

                      {booking.notes ? (
                        <View style={[styles.notesWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
                          <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                            "{booking.notes}"
                          </Text>
                        </View>
                      ) : null}

                      {/* Accept/Decline action buttons */}
                      <View style={styles.actionsRow}>
                        <AnimatedPressable
                          style={[styles.actionBtn, { backgroundColor: colors.success }]}
                          disabled={actionLoadingId === booking._id}
                          onPress={() => handleAction(booking._id, "confirmed")}
                        >
                          {actionLoadingId === booking._id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <View style={styles.buttonInner}>
                              <Check size={14} color="#ffffff" style={{ marginRight: 4 }} />
                              <Text style={styles.actionBtnText}>Confirm</Text>
                            </View>
                          )}
                        </AnimatedPressable>
                        <AnimatedPressable
                          style={[styles.actionBtn, { backgroundColor: colors.error }]}
                          disabled={actionLoadingId === booking._id}
                          onPress={() => handleAction(booking._id, "cancelled")}
                        >
                          {actionLoadingId === booking._id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <View style={styles.buttonInner}>
                              <X size={14} color="#ffffff" style={{ marginRight: 4 }} />
                              <Text style={styles.actionBtnText}>Decline</Text>
                            </View>
                          )}
                        </AnimatedPressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>

        {/* 7-Day Calendar Agenda */}
        <View style={styles.section}>
          <View style={styles.calendarHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
              7-Day Viewing Calendar
            </Text>
            <Badge variant="success">
              {confirmedBookings.length} Confirmed
            </Badge>
          </View>

          <View style={styles.calendarDaysList}>
            {calendarDays.map((day) => {
              const dayBookings = getConfirmedBookingsForDay(day.dateStr);

              return (
                <View
                  key={day.dateStr}
                  style={[
                    styles.calendarDayRow,
                    {
                      borderColor: day.isToday ? colors.primary : colors.border,
                      backgroundColor: day.isToday ? `${colors.primary}05` : colors.surface,
                    },
                  ]}
                >
                  <View style={styles.dayCol}>
                    <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day.label}</Text>
                    <Text style={[styles.dayNum, { color: day.isToday ? colors.primary : colors.textPrimary }]}>
                      {day.dayNum}
                    </Text>
                    <Text style={[styles.dayMonth, { color: colors.textSecondary }]}>{day.month}</Text>
                  </View>

                  <View style={[styles.viewingsListCol, { borderLeftColor: colors.border }]}>
                    {dayBookings.length === 0 ? (
                      <Text style={[styles.noViewingsText, { color: colors.textSecondary }]}>
                        No confirmed viewings for this day
                      </Text>
                    ) : (
                      dayBookings.map((b) => {
                        const { timeStr } = formatDateTime(b.slotStart, b.slotEnd);
                        return (
                          <AnimatedPressable
                            key={b._id}
                            style={[styles.viewingItem, { backgroundColor: colors.input, borderColor: colors.border }]}
                            onPress={() => setSelectedBooking(b)}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.viewingPropTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                {b.propertyId?.title || "Viewing Visit"}
                              </Text>
                              <Text style={[styles.viewingTenantName, { color: colors.textSecondary }]} numberOfLines={1}>
                                Tenant: {b.tenantId?.name || "Someone"}
                              </Text>
                              <View style={styles.viewingTimeRow}>
                                <Clock size={10} color={colors.primary} style={{ marginRight: 4 }} />
                                <Text style={[styles.viewingTimeVal, { color: colors.textSecondary }]}>{timeStr}</Text>
                              </View>
                            </View>
                            <Info size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                          </AnimatedPressable>
                        );
                      })
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Spacing bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirmed details Modal */}
      {selectedBooking && (
        <Modal visible={!!selectedBooking} transparent={true} animationType="slide" onRequestClose={() => setSelectedBooking(null)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.overlayDismiss} onPress={() => setSelectedBooking(null)} />
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <Info size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Viewing Details</Text>
                </View>
                <Pressable onPress={() => setSelectedBooking(null)} style={styles.closeBtn}>
                  <X size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={[styles.modalPropertyTitle, { color: colors.textPrimary }]}>
                  {selectedBooking.propertyId?.title}
                </Text>

                {/* Details list block */}
                <View style={[styles.detailsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.cardDetailItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.cardDetailLabel, { color: colors.textSecondary }]}>Date:</Text>
                    <Text style={[styles.cardDetailVal, { color: colors.textPrimary }]}>
                      {new Date(selectedBooking.slotStart).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={[styles.cardDetailItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.cardDetailLabel, { color: colors.textSecondary }]}>Time Slot:</Text>
                    <Text style={[styles.cardDetailVal, { color: colors.primary }]}>
                      {new Date(selectedBooking.slotStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(selectedBooking.slotEnd).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <View style={[styles.cardDetailItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.cardDetailLabel, { color: colors.textSecondary }]}>Tenant Name:</Text>
                    <Text style={[styles.cardDetailVal, { color: colors.textPrimary }]}>{selectedBooking.tenantId?.name}</Text>
                  </View>
                  <View style={[styles.cardDetailItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.cardDetailLabel, { color: colors.textSecondary }]}>Tenant Email:</Text>
                    <Text style={[styles.cardDetailVal, { color: colors.textPrimary }]}>{selectedBooking.tenantId?.email}</Text>
                  </View>
                  {selectedBooking.tenantId?.phone && (
                    <View style={[styles.cardDetailItem, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.cardDetailLabel, { color: colors.textSecondary }]}>Tenant Phone:</Text>
                      <Text style={[styles.cardDetailVal, { color: colors.textPrimary }]}>{selectedBooking.tenantId?.phone}</Text>
                    </View>
                  )}
                </View>

                {selectedBooking.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Tenant Note:</Text>
                    <View style={[styles.notesBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                      <Text style={[styles.notesBody, { color: colors.textPrimary }]}>
                        "{selectedBooking.notes}"
                      </Text>
                    </View>
                  </View>
                )}

                {/* Lease Action inside confirmed details */}
                <View style={styles.modalActionsWrap}>
                  <AnimatedPressable
                    style={[styles.modalLeaseBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleLeaseAction(selectedBooking)}
                  >
                    <View style={styles.buttonInner}>
                      <FileText size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.modalLeaseBtnText}>Lease Agreement</Text>
                    </View>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={[styles.modalCloseBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
                    onPress={() => setSelectedBooking(null)}
                  >
                    <Text style={[styles.modalCloseBtnText, { color: colors.textPrimary }]}>Close</Text>
                  </AnimatedPressable>
                </View>
              </ScrollView>
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
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm + 2,
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
  propertyGroup: {
    marginBottom: spacing.md,
  },
  propertyHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
  },
  bookingCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tenantInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  tenantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  tenantAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tenantAvatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  tenantName: {
    fontSize: 13,
    fontWeight: "800",
  },
  tenantEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  detailsBlock: {
    borderWidth: 1,
    borderRadius: radius.md + 2,
    padding: spacing.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsText: {
    fontSize: 11,
    fontWeight: "600",
  },
  notesWrapper: {
    borderWidth: 1,
    borderRadius: radius.md + 2,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  notesText: {
    fontSize: 11,
    fontStyle: "italic",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: radius.md + 2,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDaysList: {
    gap: spacing.sm,
  },
  calendarDayRow: {
    flexDirection: "row",
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.sm + 2,
  },
  dayCol: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  dayNum: {
    fontSize: 18,
    fontWeight: "900",
    marginVertical: 2,
  },
  dayMonth: {
    fontSize: 8,
    fontWeight: "700",
  },
  viewingsListCol: {
    flex: 1,
    borderLeftWidth: 1,
    paddingLeft: spacing.md,
    justifyContent: "center",
    gap: 8,
  },
  noViewingsText: {
    fontSize: 11,
    fontStyle: "italic",
    paddingVertical: 6,
  },
  viewingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radius.md + 2,
    borderWidth: 1,
  },
  viewingPropTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  viewingTenantName: {
    fontSize: 11,
    marginTop: 2,
  },
  viewingTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  viewingTimeVal: {
    fontSize: 10,
    fontWeight: "700",
  },
  // Details Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayDismiss: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: spacing.md,
  },
  modalPropertyTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  detailsCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 8,
    marginBottom: spacing.md,
  },
  cardDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 0.8,
  },
  cardDetailLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardDetailVal: {
    fontSize: 12,
    fontWeight: "700",
  },
  notesContainer: {
    marginBottom: spacing.lg,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  notesBox: {
    borderRadius: radius.xl,
    borderWidth: 1.2,
    padding: spacing.md,
  },
  notesBody: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  modalActionsWrap: {
    gap: 12,
  },
  modalLeaseBtn: {
    height: 44,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLeaseBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  modalCloseBtn: {
    height: 44,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  modalCloseBtnText: {
    fontSize: 13,
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
