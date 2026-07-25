import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar, Clock, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, X } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import { bookingService, AvailabilitySlotResponse } from "../../features/bookings/services/bookingService";
import { messageService } from "../../features/messages/services/messageService";
import { hslToHex, getOpacityColor } from "../../utils/colors";
import AnimatedPressable from "../ui/AnimatedPressable";
import SkeletonLoader from "../ui/SkeletonLoader";
import type { RootStackParamList } from "../../navigation/types";
import { radius, spacing } from "@shared/theme/tokens";

interface BookingWidgetProps {
  propertyId: string;
  ownerId: string;
  propertyTitle: string;
}

export default function BookingWidget({ propertyId, ownerId, propertyTitle }: BookingWidgetProps) {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isGuest } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // States
  const [slots, setSlots] = useState<AvailabilitySlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlotResponse | null>(null);
  const [notes, setNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<AvailabilitySlotResponse | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const computedSlots = await bookingService.getAvailability(propertyId, 14);
        setSlots(computedSlots);
      } catch (err: any) {
        console.error("Error fetching availability:", err);
        setError(err.message || "Failed to load availability");
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchAvailability();
    }
  }, [propertyId]);

  // Group slots by date string (YYYY-MM-DD)
  const groupedSlots = useMemo(() => {
    const groups: Record<string, AvailabilitySlotResponse[]> = {};
    slots.forEach((slot) => {
      const dateStr = new Date(slot.slotStart).toISOString().split("T")[0];
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(slot);
    });
    return groups;
  }, [slots]);

  // Generate next 14 days
  const next14Days = useMemo(() => {
    const days = [];
    const start = new Date();
    for (let i = 0; i < 14; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split("T")[0];
      const hasSlots = !!groupedSlots[dateStr] && groupedSlots[dateStr].length > 0;
      days.push({
        dateStr,
        dayLabel: current.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: current.getDate(),
        monthLabel: current.toLocaleDateString("en-US", { month: "short" }),
        hasSlots,
      });
    }
    return days;
  }, [groupedSlots]);

  // Set default selected date (first day with slots, or first day)
  useEffect(() => {
    if (next14Days.length > 0 && !selectedDateStr) {
      const firstAvailable = next14Days.find((d) => d.hasSlots);
      if (firstAvailable) {
        setSelectedDateStr(firstAvailable.dateStr);
      } else {
        setSelectedDateStr(next14Days[0].dateStr);
      }
    }
  }, [next14Days, selectedDateStr]);

  const activeSlots = useMemo(() => {
    return groupedSlots[selectedDateStr] || [];
  }, [groupedSlots, selectedDateStr]);

  const handleSlotPress = (slot: AvailabilitySlotResponse) => {
    if (!isAuthenticated || isGuest) {
      navigation.navigate("Login");
      return;
    }
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    try {
      await bookingService.requestVisit(propertyId, selectedSlot.slotStart, selectedSlot.slotEnd, notes);
      setBookingSuccess(selectedSlot);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Booking request error:", err);
      setError(err.message || "Failed to request visit booking");
    } finally {
      setBookingLoading(false);
    }
  };

  const hasAnyAvailability = slots.length > 0;

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SkeletonLoader width={120} height={18} style={{ marginBottom: 16 }} />
        <View style={styles.horizontalRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} width={50} height={64} borderRadius={12} style={{ marginRight: 10 }} />
          ))}
        </View>
        <View style={styles.gridContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="30%" height={36} borderRadius={10} style={{ marginRight: i !== 3 ? 10 : 0 }} />
          ))}
        </View>
      </View>
    );
  }

  const handleMessageOwner = async () => {
    if (!isAuthenticated || isGuest) {
      navigation.navigate("Login");
      return;
    }
    
    setMessageLoading(true);
    try {
      const result = await messageService.createConversation(ownerId, propertyId);
      if (result.success) {
        const conversationId = result.data?.conversation?._id || result.data?.conversation?.id || result.data?._id || result.data?.id;
        navigation.navigate("Messages" as any, { conversationId });
      } else {
        Alert.alert("Error", result.message || "Failed to start conversation.");
      }
    } catch (error: any) {
      console.error("Error creating conversation in BookingWidget:", error);
      Alert.alert("Error", error.response?.data?.message || "Could not start a conversation.");
    } finally {
      setMessageLoading(false);
    }
  };

  if (error || !hasAnyAvailability) {
    return (
      <View style={[styles.card, styles.centerAlign, { backgroundColor: hslToHex(colors.surface), borderColor: hslToHex(colors.border) }]}>
        <AlertCircle size={28} color={hslToHex(colors.textSecondary)} style={{ marginBottom: 8, opacity: 0.6 }} />
        <Text style={[styles.title, { color: hslToHex(colors.textPrimary) }]}>Schedule a Visit</Text>
        <Text style={[styles.subtitle, { color: hslToHex(colors.textSecondary) }]}>
          No active scheduling rules set by the owner. You can contact them directly in chat to set up a walkthrough.
        </Text>
        <AnimatedPressable
          style={[styles.actionButton, { backgroundColor: hslToHex(colors.primary) }]}
          disabled={messageLoading}
          onPress={handleMessageOwner}
        >
          <View style={styles.buttonInner}>
            {messageLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MessageSquare size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonText}>
                  {isAuthenticated && !isGuest ? "Message Owner" : "Login to Message"}
                </Text>
              </>
            )}
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  if (bookingSuccess) {
    const formattedDate = new Date(bookingSuccess.slotStart).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={[styles.card, styles.centerAlign, { backgroundColor: hslToHex(colors.surface), borderColor: hslToHex(colors.border) }]}>
        <View style={[styles.successIconWrapper, { backgroundColor: hslToHex(getOpacityColor(colors.success, 0.15)) }]}>
          <CheckCircle2 size={32} color={hslToHex(colors.success)} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Visit Requested!</Text>
        <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
          We have submitted your request for{"\n"}
          <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{formattedDate}</Text>.
        </Text>
        <Text style={[styles.successHint, { color: colors.primary }]}>
          You will be notified as soon as the owner confirms.
        </Text>
        <AnimatedPressable
          style={[styles.secondaryButton, { backgroundColor: colors.input, borderColor: colors.border }]}
          onPress={() => navigation.navigate("MyVisits" as any)}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>View My Visits</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Calendar size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.widgetHeading, { color: colors.textPrimary }]}>Schedule a Visit</Text>
      </View>

      {/* Date chips horizontal scroll */}
      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {next14Days.map((day) => {
            const isSelected = selectedDateStr === day.dateStr;
            return (
              <AnimatedPressable
                key={day.dateStr}
                disabled={!day.hasSlots}
                onPress={() => setSelectedDateStr(day.dateStr)}
                style={[
                  styles.dateChip,
                  {
                    borderColor: isSelected
                      ? hslToHex(colors.primary)
                      : day.hasSlots
                      ? hslToHex(colors.border)
                      : hslToHex(getOpacityColor(colors.border, 0.3)),
                    backgroundColor: isSelected
                      ? hslToHex(getOpacityColor(colors.primary, 0.12))
                      : day.hasSlots
                      ? hslToHex(colors.background)
                      : "transparent",
                    opacity: day.hasSlots ? 1 : 0.4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateDayLabel,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {day.dayLabel}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    {
                      color: isSelected ? colors.primary : colors.textPrimary,
                      fontWeight: isSelected ? "800" : "600",
                    },
                  ]}
                >
                  {day.dayNum}
                </Text>
                <Text
                  style={[
                    styles.dateMonth,
                    { color: isSelected ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {day.monthLabel}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Time slots grid */}
      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Available Time</Text>
        {activeSlots.length > 0 ? (
          <View style={styles.slotsGrid}>
            {activeSlots.map((slot, idx) => {
              const timeString = new Date(slot.slotStart).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <AnimatedPressable
                  key={idx}
                  onPress={() => handleSlotPress(slot)}
                  style={[
                    styles.slotButton,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.slotText, { color: colors.textPrimary }]}>{timeString}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptySlotsWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Text style={[styles.emptySlotsText, { color: colors.textSecondary }]}>
              No time slots available for this day
            </Text>
          </View>
        )}
      </View>

      {/* Confirmation Modal Sheet */}
      {selectedSlot && (
        <Modal visible={isModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.overlayDismiss} onPress={() => setIsModalOpen(false)} />
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={styles.headerLeft}>
                  <Calendar size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Confirm Visit Request</Text>
                </View>
                <Pressable onPress={() => setIsModalOpen(false)} style={styles.closeButton}>
                  <X size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={[styles.propertyLabel, { color: colors.textSecondary }]}>
                  Property: <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{propertyTitle}</Text>
                </Text>

                {/* Details Summary Block */}
                <View style={[styles.summaryBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Date:</Text>
                    <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>
                      {new Date(selectedSlot.slotStart).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Time Slot:</Text>
                    <Text style={[styles.summaryVal, { color: colors.primary }]}>
                      {new Date(selectedSlot.slotStart).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      -{" "}
                      {new Date(selectedSlot.slotEnd).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>

                {/* Notes Input */}
                <View style={styles.notesContainer}>
                  <Text style={[styles.notesLabel, { color: colors.textPrimary }]}>
                    Add a message for the owner (optional)
                  </Text>
                  <TextInput
                    placeholder="Tell the owner why you are visiting, e.g., 'Looking to move in immediately...'"
                    placeholderTextColor={colors.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline={true}
                    numberOfLines={4}
                    style={[
                      styles.notesInput,
                      {
                        backgroundColor: colors.input,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                </View>

                {/* Action buttons */}
                <View style={styles.actionsRow}>
                  <AnimatedPressable
                    style={[styles.modalSecondaryBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
                    onPress={() => setIsModalOpen(false)}
                  >
                    <Text style={[styles.modalSecondaryBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary }]}
                    disabled={bookingLoading}
                    onPress={handleConfirmBooking}
                  >
                    {bookingLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <View style={styles.buttonInner}>
                        <Text style={styles.modalPrimaryBtnText}>Request Visit</Text>
                        <ChevronRight size={14} color="#ffffff" style={{ marginLeft: 4 }} />
                      </View>
                    )}
                  </AnimatedPressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  centerAlign: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  widgetHeading: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionWrap: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs + 2,
  },
  horizontalRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  gridContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dateScroll: {
    paddingVertical: spacing.xs,
  },
  dateChip: {
    width: 46,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md + 2,
    borderWidth: 1.5,
    marginRight: spacing.sm,
  },
  dateDayLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  dateNum: {
    fontSize: 14,
    marginVertical: 2,
  },
  dateMonth: {
    fontSize: 8,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md + 2,
    borderWidth: 1.2,
    minWidth: "30%",
  },
  slotText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptySlotsWrap: {
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md + 2,
    borderWidth: 1,
  },
  emptySlotsText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.md + 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  successIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  successHint: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.md + 2,
    borderWidth: 1.2,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  // Modal Sheet Styles
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
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
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
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: spacing.md,
  },
  propertyLabel: {
    fontSize: 13,
    marginBottom: spacing.md,
  },
  summaryBlock: {
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.xl,
    gap: 8,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  summaryVal: {
    fontSize: 13,
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
  notesInput: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.sm + 2,
    fontSize: 12,
    lineHeight: 18,
    height: 80,
    textAlignVertical: "top",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalPrimaryBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalPrimaryBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
