import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar, Clock, Plus, Trash2, Save, Eye, AlertTriangle, ArrowLeft } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import { bookingService, AvailabilityRule, AvailabilitySlotResponse } from "../../features/bookings/services/bookingService";
import AppButton from "../../components/ui/AppButton";
import AnimatedPressable from "../../components/ui/AnimatedPressable";
import Select, { SelectOption } from "../../components/ui/Select";
import type { RootStackParamList } from "../../navigation/types";
import { radius, spacing } from "@shared/theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "AvailabilityEditor">;

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const DURATION_OPTIONS: SelectOption[] = [
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "60 min", value: "60" },
];

interface WeeklyItem {
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

interface OverrideItem {
  id: string; // client-side temp or backend id
  specificDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export default function AvailabilityEditorScreen({ route, navigation }: Props) {
  const { propertyId, propertyTitle } = route.params;
  const { colors, isDark } = useTheme();

  // Weekly templates state
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyItem[]>(
    DAYS_OF_WEEK.map((d) => ({
      dayOfWeek: d.value,
      label: d.label,
      enabled: false,
      startTime: "09:00",
      endTime: "17:00",
      slotDurationMinutes: 30,
    }))
  );

  // Overrides state
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);

  // Override Form state
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideIsActive, setOverrideIsActive] = useState(false);
  const [overrideStartTime, setOverrideStartTime] = useState("09:00");
  const [overrideEndTime, setOverrideEndTime] = useState("17:00");
  const [overrideDuration, setOverrideDuration] = useState(30);

  // Computed slots preview
  const [computedPreview, setComputedPreview] = useState<AvailabilitySlotResponse[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  // DateTimePicker State
  const [pickerMode, setPickerMode] = useState<"date" | "time">("time");
  const [showPicker, setShowPicker] = useState(false);
  // Track what we are picking for
  const [pickingTarget, setPickingTarget] = useState<{
    type: "weekly" | "override_form" | "override_list";
    dayOfWeek?: number;
    overrideId?: string;
    field: "startTime" | "endTime" | "specificDate";
  } | null>(null);

  // Convert "HH:MM" string to Date for DateTimePicker
  const timeToDate = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Fetch preview
  const fetchComputedPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const slots = await bookingService.getAvailability(propertyId, 7);
      setComputedPreview(slots);
    } catch (err) {
      console.error("Error fetching computed preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  }, [propertyId]);

  // Fetch raw rules
  const fetchRawRules = useCallback(async () => {
    setLoadingData(true);
    try {
      const fetchedRules = await bookingService.getRawRules(propertyId);
      
      // Map to weekly
      setWeeklySchedule((prev) =>
        prev.map((day) => {
          const rule = fetchedRules.find((r) => r.type === "recurring" && r.dayOfWeek === day.dayOfWeek);
          if (rule) {
            return {
              ...day,
              enabled: rule.isActive,
              startTime: rule.startTime,
              endTime: rule.endTime,
              slotDurationMinutes: rule.slotDurationMinutes,
            };
          }
          return day;
        })
      );

      // Map to overrides
      const overrideRules = fetchedRules
        .filter((r) => r.type === "override")
        .map((r) => ({
          id: r._id || Math.random().toString(),
          specificDate: r.specificDate ? new Date(r.specificDate).toISOString().split("T")[0] : "",
          startTime: r.startTime,
          endTime: r.endTime,
          slotDurationMinutes: r.slotDurationMinutes,
          isActive: r.isActive,
        }));
      setOverrides(overrideRules);
    } catch (err) {
      console.error("Error fetching rules:", err);
      Alert.alert("Error", "Failed to load existing availability settings.");
    } finally {
      setLoadingData(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchRawRules();
      fetchComputedPreview();
    }
  }, [propertyId, fetchRawRules, fetchComputedPreview]);

  // Handlers
  const handleWeeklyCheckChange = (dayOfWeek: number, val: boolean) => {
    setWeeklySchedule((prev) =>
      prev.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, enabled: val } : day))
    );
  };

  const handleWeeklyDurationChange = (dayOfWeek: number, val: string) => {
    setWeeklySchedule((prev) =>
      prev.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, slotDurationMinutes: Number(val) } : day))
    );
  };

  const openTimePicker = (
    type: "weekly" | "override_form",
    field: "startTime" | "endTime",
    dayOfWeek?: number
  ) => {
    setPickerMode("time");
    setPickingTarget({ type, field, dayOfWeek });
    setShowPicker(true);
  };

  const openDatePicker = () => {
    setPickerMode("date");
    setPickingTarget({ type: "override_form", field: "specificDate" });
    setShowPicker(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedValue?: Date) => {
    setShowPicker(false);
    if (event.type === "dismissed" || !selectedValue || !pickingTarget) {
      setPickingTarget(null);
      return;
    }

    if (pickerMode === "time") {
      const hours = String(selectedValue.getHours()).padStart(2, "0");
      const minutes = String(selectedValue.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      if (pickingTarget.type === "weekly" && pickingTarget.dayOfWeek !== undefined) {
        setWeeklySchedule((prev) =>
          prev.map((day) =>
            day.dayOfWeek === pickingTarget.dayOfWeek ? { ...day, [pickingTarget.field]: timeStr } : day
          )
        );
      } else if (pickingTarget.type === "override_form") {
        if (pickingTarget.field === "startTime") {
          setOverrideStartTime(timeStr);
        } else {
          setOverrideEndTime(timeStr);
        }
      }
    } else if (pickerMode === "date") {
      const dateStr = selectedValue.toISOString().split("T")[0];
      setOverrideDate(dateStr);
    }

    setPickingTarget(null);
  };

  // Add Date Override
  const handleAddOverride = () => {
    if (!overrideDate) {
      Alert.alert("Input Required", "Please select a date for the override.");
      return;
    }

    if (overrides.some((o) => o.specificDate === overrideDate)) {
      Alert.alert("Duplicate Override", "An override already exists for this date. Delete it first to update.");
      return;
    }

    const newOverride: OverrideItem = {
      id: Date.now().toString(),
      specificDate: overrideDate,
      isActive: overrideIsActive,
      startTime: overrideIsActive ? overrideStartTime : "00:00",
      endTime: overrideIsActive ? overrideEndTime : "00:00",
      slotDurationMinutes: overrideDuration,
    };

    setOverrides((prev) => [...prev, newOverride]);
    setOverrideDate("");
    setOverrideIsActive(false);
  };

  // Remove Override
  const handleRemoveOverride = (id: string) => {
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  };

  // Save rules
  const handleSave = async () => {
    setSaving(true);
    
    // Construct payload
    const slotsPayload: AvailabilityRule[] = [];

    // Recurring
    weeklySchedule.forEach((day) => {
      slotsPayload.push({
        type: "recurring",
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        slotDurationMinutes: day.slotDurationMinutes,
        isActive: day.enabled,
      });
    });

    // Overrides
    overrides.forEach((ov) => {
      slotsPayload.push({
        type: "override",
        specificDate: ov.specificDate,
        startTime: ov.startTime,
        endTime: ov.endTime,
        slotDurationMinutes: ov.slotDurationMinutes,
        isActive: ov.isActive,
      });
    });

    try {
      await bookingService.saveAvailabilityRules(propertyId, slotsPayload);
      Alert.alert("Success", "Availability settings saved successfully.");
      await fetchComputedPreview();
      await fetchRawRules();
    } catch (err: any) {
      console.error("Error saving availability:", err);
      Alert.alert("Save Failed", err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // Group slots for preview list
  const groupedPreview = useMemo(() => {
    const groups: Record<string, AvailabilitySlotResponse[]> = {};
    computedPreview.forEach((slot) => {
      const dateStr = new Date(slot.slotStart).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(slot);
    });
    return Object.entries(groups);
  }, [computedPreview]);

  // Get date for date picker minimum value
  const getMinDate = () => {
    const d = new Date();
    return d;
  };

  // Determine date object for DateTimePicker parameter
  const getPickerValue = () => {
    if (!pickingTarget) return new Date();
    if (pickerMode === "time") {
      if (pickingTarget.type === "weekly" && pickingTarget.dayOfWeek !== undefined) {
        const day = weeklySchedule.find((d) => d.dayOfWeek === pickingTarget.dayOfWeek);
        if (day && (pickingTarget.field === "startTime" || pickingTarget.field === "endTime")) {
          return timeToDate(day[pickingTarget.field]);
        }
      } else if (pickingTarget.type === "override_form") {
        if (pickingTarget.field === "startTime" || pickingTarget.field === "endTime") {
          return timeToDate(pickingTarget.field === "startTime" ? overrideStartTime : overrideEndTime);
        }
      }
    } else {
      return overrideDate ? new Date(overrideDate) : new Date();
    }
    return new Date();
  };

  if (loadingData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading settings...</Text>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Manage Visit Availability</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {propertyTitle}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Weekly Template */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.numberCircle, { backgroundColor: `${colors.primary}15` }]}>
              <Text style={[styles.numberText, { color: colors.primary }]}>1</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Weekly Recurring Hours</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Set general days and times you are regularly available to host property viewings.
          </Text>

          <View style={styles.weeklyList}>
            {weeklySchedule.map((day) => (
              <View
                key={day.dayOfWeek}
                style={[
                  styles.weeklyRow,
                  {
                    borderColor: day.enabled ? `${colors.primary}30` : colors.border,
                    backgroundColor: day.enabled ? `${colors.primary}05` : "transparent",
                  },
                ]}
              >
                <View style={styles.rowTop}>
                  <Text style={[styles.dayName, { color: colors.textPrimary }]}>{day.label}</Text>
                  <Switch
                    value={day.enabled}
                    onValueChange={(val) => handleWeeklyCheckChange(day.dayOfWeek, val)}
                    trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                    thumbColor={day.enabled ? colors.primary : colors.textSecondary}
                  />
                </View>

                {day.enabled && (
                  <View style={styles.rowBottom}>
                    <View style={styles.timeInputsWrap}>
                      <Pressable
                        onPress={() => openTimePicker("weekly", "startTime", day.dayOfWeek)}
                        style={[styles.timePickerButton, { backgroundColor: colors.input, borderColor: colors.border }]}
                      >
                        <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.timeText, { color: colors.textPrimary }]}>{day.startTime}</Text>
                      </Pressable>
                      <Text style={[styles.connectorText, { color: colors.textSecondary }]}>to</Text>
                      <Pressable
                        onPress={() => openTimePicker("weekly", "endTime", day.dayOfWeek)}
                        style={[styles.timePickerButton, { backgroundColor: colors.input, borderColor: colors.border }]}
                      >
                        <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.timeText, { color: colors.textPrimary }]}>{day.endTime}</Text>
                      </Pressable>
                    </View>

                    <View style={styles.durationSelectWrap}>
                      <Select
                        placeholder="Duration"
                        value={String(day.slotDurationMinutes)}
                        options={DURATION_OPTIONS}
                        onValueChange={(val) => handleWeeklyDurationChange(day.dayOfWeek, val)}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Date Overrides */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.numberCircle, { backgroundColor: `${colors.primary}15` }]}>
              <Text style={[styles.numberText, { color: colors.primary }]}>2</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Specific Date Overrides</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Block dates (holidays, private functions) or schedule separate viewing slots for specific days.
          </Text>

          {/* Form */}
          <View style={[styles.overrideForm, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Select Date</Text>
                <Pressable
                  onPress={openDatePicker}
                  style={[styles.dateSelectorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Calendar size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.dateSelectorText, { color: overrideDate ? colors.textPrimary : colors.textSecondary }]}>
                    {overrideDate ? new Date(overrideDate).toLocaleDateString() : "YYYY-MM-DD"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.formSwitchWrap}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Available?</Text>
                <View style={styles.switchAlign}>
                  <Switch
                    value={overrideIsActive}
                    onValueChange={setOverrideIsActive}
                    trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                    thumbColor={overrideIsActive ? colors.primary : colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            {overrideIsActive && (
              <View style={[styles.formBottomFields, { borderTopColor: colors.border }]}>
                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Time Range</Text>
                    <View style={styles.timeInputsWrap}>
                      <Pressable
                        onPress={() => openTimePicker("override_form", "startTime")}
                        style={[styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        <Text style={[styles.timeText, { color: colors.textPrimary }]}>{overrideStartTime}</Text>
                      </Pressable>
                      <Text style={[styles.connectorText, { color: colors.textSecondary }]}>to</Text>
                      <Pressable
                        onPress={() => openTimePicker("override_form", "endTime")}
                        style={[styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        <Text style={[styles.timeText, { color: colors.textPrimary }]}>{overrideEndTime}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={{ width: 120 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Duration</Text>
                    <Select
                      placeholder="Duration"
                      value={String(overrideDuration)}
                      options={DURATION_OPTIONS}
                      onValueChange={(val) => setOverrideDuration(Number(val))}
                    />
                  </View>
                </View>
              </View>
            )}

            <AnimatedPressable
              style={[styles.addButton, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={handleAddOverride}
            >
              <View style={styles.buttonInner}>
                <Plus size={14} color={colors.textPrimary} style={{ marginRight: 4 }} />
                <Text style={[styles.addButtonText, { color: colors.textPrimary }]}>Add Override</Text>
              </View>
            </AnimatedPressable>
          </View>

          {/* List of current overrides */}
          {overrides.length > 0 && (
            <View style={[styles.overridesList, { borderColor: colors.border }]}>
              {overrides.map((ov) => (
                <View key={ov.id} style={[styles.overrideListItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.overrideInfo}>
                    <View style={[styles.statusIndicator, { backgroundColor: ov.isActive ? colors.success : colors.error }]} />
                    <View>
                      <Text style={[styles.overrideDateText, { color: colors.textPrimary }]}>
                        {new Date(ov.specificDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                      <Text style={[styles.overrideTimeText, { color: colors.textSecondary }]}>
                        {ov.isActive
                          ? `${ov.startTime} - ${ov.endTime} (${ov.slotDurationMinutes}m slots)`
                          : "Blocked Entire Day"}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => handleRemoveOverride(ov.id)} style={styles.deleteButton}>
                    <Trash2 size={16} color={colors.error} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Live Preview */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Eye size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Live 7-Day Preview</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Preview computed time slots that prospective tenants can book on your properties.
          </Text>

          {loadingPreview ? (
            <View style={styles.previewCenter}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : groupedPreview.length > 0 ? (
            <View style={styles.previewList}>
              {groupedPreview.map(([dateStr, slots]) => (
                <View key={dateStr} style={styles.previewDayGroup}>
                  <Text style={[styles.previewDayHeader, { color: colors.textPrimary, borderBottomColor: colors.border }]}>
                    {dateStr}
                  </Text>
                  <View style={styles.previewSlotsGrid}>
                    {slots.map((s, idx) => (
                      <View
                        key={idx}
                        style={[styles.previewSlotBadge, { backgroundColor: colors.input, borderColor: colors.border }]}
                      >
                        <Clock size={10} color={colors.primary} style={{ marginRight: 3 }} />
                        <Text style={[styles.previewSlotText, { color: colors.textSecondary }]}>
                          {new Date(s.slotStart).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyPreviewBlock, { borderColor: colors.border }]}>
              <AlertTriangle size={24} color={colors.warning} style={{ marginBottom: 6 }} />
              <Text style={[styles.emptyPreviewTitle, { color: colors.textPrimary }]}>No Slots Computed</Text>
              <Text style={[styles.emptyPreviewSubtitle, { color: colors.textSecondary }]}>
                Ensure weekly rules are enabled or active override configurations are set.
              </Text>
            </View>
          )}
        </View>

        {/* Spacing for button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Save Actions Bar */}
      <View style={[styles.footerBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <AppButton onPress={handleSave} disabled={saving} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View style={styles.buttonInner}>
              <Save size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Save Availability</Text>
            </View>
          )}
        </AppButton>
      </View>

      {/* Date/Time picker modal integration */}
      {showPicker && (
        <DateTimePicker
          value={getPickerValue()}
          mode={pickerMode}
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={pickerMode === "date" ? getMinDate() : undefined}
          onChange={handlePickerChange}
        />
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
  sectionCard: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  numberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  numberText: {
    fontSize: 11,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  sectionDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  weeklyList: {
    gap: spacing.sm,
  },
  weeklyRow: {
    borderRadius: radius.xl,
    borderWidth: 1.2,
    padding: spacing.sm + 2,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: {
    fontSize: 13,
    fontWeight: "700",
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: spacing.sm,
    gap: 8,
  },
  timeInputsWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  timePickerButton: {
    flex: 1,
    height: 38,
    borderRadius: radius.md + 2,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  connectorText: {
    marginHorizontal: 4,
    fontSize: 11,
  },
  durationSelectWrap: {
    flex: 1,
    // Align select height with time button (excluding labels etc.)
  },
  overrideForm: {
    borderRadius: radius.xl,
    borderWidth: 1.2,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  formSwitchWrap: {
    width: 90,
  },
  switchAlign: {
    height: 38,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dateSelectorBox: {
    height: 38,
    borderRadius: radius.md + 2,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  dateSelectorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  formBottomFields: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  addButton: {
    paddingVertical: 10,
    borderRadius: radius.md + 2,
    borderWidth: 1.2,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  overridesList: {
    marginTop: spacing.md,
    borderWidth: 1.2,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  overrideListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm + 2,
    borderBottomWidth: 0.8,
  },
  overrideInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  overrideDateText: {
    fontSize: 12,
    fontWeight: "700",
  },
  overrideTimeText: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteButton: {
    padding: 6,
  },
  previewCenter: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  previewList: {
    gap: spacing.md,
  },
  previewDayGroup: {
    gap: spacing.xs,
  },
  previewDayHeader: {
    fontSize: 11,
    fontWeight: "800",
    borderBottomWidth: 0.8,
    paddingBottom: 2,
  },
  previewSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  previewSlotBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
  },
  previewSlotText: {
    fontSize: 9,
    fontWeight: "600",
  },
  emptyPreviewBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: radius.xl,
  },
  emptyPreviewTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  emptyPreviewSubtitle: {
    fontSize: 11,
    textAlign: "center",
  },
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
    elevation: 8,
  },
  saveButton: {
    width: "100%",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
