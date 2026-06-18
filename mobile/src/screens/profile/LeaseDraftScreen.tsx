import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, FileText, Calendar, PenTool, CheckCircle, Clock, Download, ChevronRight, FileSignature } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import SignatureScreen from "react-native-signature-canvas";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import { leaseService, LeaseDraft, LeaseTerms } from "../../features/leases/services/leaseService";
import { getAccessToken } from "../../features/auth/services/tokenStorage";
import { env } from "../../config/env";
import AppButton from "../../components/ui/AppButton";
import Card from "../../components/ui/Card";

type Props = {
  route: {
    params: {
      leaseId?: string;
      propertyId?: string;
      tenantId?: string;
    };
  };
};

export default function LeaseDraftScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuth();
  
  const { leaseId, propertyId, tenantId } = route.params || {};
  const currentUserId = (user as any)?._id || (user as any)?.id || "";

  // States
  const [lease, setLease] = useState<LeaseDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSignModalVisible, setIsSignModalVisible] = useState(false);

  // Form states (for creation or editing drafts)
  const [rentAmount, setRentAmount] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [noticePeriod, setNoticePeriod] = useState("30");
  const [additionalClauses, setAdditionalClauses] = useState("");

  // Date picker visibility states
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchLease = async () => {
    setLoading(true);
    try {
      if (leaseId) {
        const data = await leaseService.getLeaseById(leaseId);
        setLease(data);
        populateForm(data.terms);
      } else if (propertyId && tenantId) {
        const data = await leaseService.getLeaseByPropertyAndTenant(propertyId, tenantId);
        if (data) {
          setLease(data);
          populateForm(data.terms);
        }
      }
    } catch (error) {
      console.error("Error loading lease:", error);
      Alert.alert("Error", "Could not retrieve lease agreement details.");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (terms: LeaseTerms) => {
    setRentAmount(String(terms.rentAmount));
    setSecurityDeposit(String(terms.securityDeposit));
    setStartDate(new Date(terms.leaseStartDate));
    setEndDate(new Date(terms.leaseEndDate));
    setNoticePeriod(String(terms.noticePeriodDays));
    setAdditionalClauses(terms.additionalClauses || "");
  };

  useEffect(() => {
    fetchLease();
  }, [leaseId, propertyId, tenantId]);

  const isOwner = useMemo(() => {
    if (!lease && propertyId) {
      // In creation mode, if we arrived here, we assume the user is the landlord
      return true;
    }
    if (!lease || !user) return false;
    const leaseOwnerId = lease.ownerId?._id || lease.ownerId;
    return String(leaseOwnerId) === String(currentUserId);
  }, [lease, user, currentUserId, propertyId]);

  // Handle Save (Draft creation or edit update)
  const handleSave = async () => {
    if (!rentAmount || isNaN(Number(rentAmount)) || Number(rentAmount) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid monthly rent amount.");
      return;
    }

    const terms: LeaseTerms = {
      rentAmount: Number(rentAmount),
      securityDeposit: Number(securityDeposit) || 0,
      leaseStartDate: startDate.toISOString(),
      leaseEndDate: endDate.toISOString(),
      noticePeriodDays: Number(noticePeriod) || 30,
      additionalClauses,
    };

    setSaving(true);
    try {
      if (lease) {
        const updated = await leaseService.updateLeaseTerms(lease._id, terms);
        setLease(updated);
        Alert.alert("Success", "Lease agreement draft updated successfully.");
      } else if (propertyId && tenantId) {
        const created = await leaseService.createLeaseDraft(propertyId, tenantId, terms);
        setLease(created);
        Alert.alert("Success", "Lease agreement draft created.");
      }
    } catch (err: any) {
      console.error("Error saving lease:", err);
      Alert.alert("Error", err.message || "Failed to save lease agreement details.");
    } finally {
      setSaving(false);
    }
  };

  // Lock and send lease draft
  const handleSendDraft = async () => {
    if (!lease) return;
    Alert.alert(
      "Send Lease Agreement",
      "Are you sure you want to send this lease agreement to the tenant? Once sent, terms will be locked for editing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            setSaving(true);
            try {
              const updated = await leaseService.sendLeaseDraft(lease._id);
              setLease(updated);
              Alert.alert("Sent", "Lease agreement sent to tenant for signature.");
            } catch (err: any) {
              console.error("Error sending draft:", err);
              Alert.alert("Error", "Could not send lease agreement.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // Signature screen callbacks
  const handleOK = async (signature: string) => {
    setIsSignModalVisible(false);
    if (!lease) return;

    setSaving(true);
    try {
      const updated = await leaseService.signLease(lease._id, signature);
      setLease(updated);
      Alert.alert("Signed", "Your e-signature has been recorded successfully.");
    } catch (err: any) {
      console.error("Signature recording error:", err);
      Alert.alert("Error", "Failed to record signature.");
    } finally {
      setSaving(false);
    }
  };

  // Download PDF bytes
  const handleDownloadPDF = async () => {
    if (!lease) return;
    setSaving(true);
    try {
      const token = await getAccessToken();
      const localUri = `${FileSystem.cacheDirectory}Signed_Lease_${lease._id}.pdf`;

      const downloadResult = await FileSystem.downloadAsync(
        `${env.apiBaseUrl}/api/leases/${lease._id}/pdf`,
        localUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status !== 200) {
        throw new Error("Secure download failed");
      }

      await Sharing.shareAsync(downloadResult.uri);
    } catch (e) {
      console.error("PDF download failed:", e);
      Alert.alert("Download Failed", "Could not generate or download lease agreement PDF.");
    } finally {
      setSaving(false);
    }
  };

  // Get active index for timeline
  const getTimelineStepIndex = (status: string) => {
    switch (status) {
      case "draft":
        return 0;
      case "sent":
        return 1;
      case "signed_by_tenant":
        return 2;
      case "signed_by_owner":
        return 2;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Loading lease details...</Text>
      </View>
    );
  }

  const status = lease?.status || "draft";
  const activeStep = getTimelineStepIndex(status);

  // Determine if active user can sign
  const canUserSign = () => {
    if (!lease) return false;
    if (status === "draft" || status === "completed") return false;
    
    const isTenant = String(lease.tenantId?._id || lease.tenantId) === String(currentUserId);
    const isLandlord = String(lease.ownerId?._id || lease.ownerId) === String(currentUserId);
    
    if (isTenant && !lease.tenantSignature) return true;
    if (isLandlord && !lease.ownerSignature) return true;
    
    return false;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lease Agreement</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {lease ? `Status: ${status.replace(/_/g, " ").toUpperCase()}` : "DRAFT NEW LEASE"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Timeline Stepper */}
        {lease && (
          <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Agreement Progress</Text>
            <View style={styles.timeline}>
              {[
                { label: "Draft", active: activeStep >= 0 },
                { label: "Sent", active: activeStep >= 1 },
                { label: "Signed", active: activeStep >= 2 },
                { label: "Completed", active: activeStep >= 4 },
              ].map((step, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: step.active ? colors.success : colors.border },
                      ]}
                    />
                  )}
                  <View style={styles.timelineStep}>
                    <View
                      style={[
                        styles.timelineIndicator,
                        {
                          backgroundColor: step.active ? colors.success : colors.input,
                          borderColor: step.active ? colors.success : colors.border,
                        },
                      ]}
                    >
                      {step.active ? (
                        <CheckCircle size={12} color="#ffffff" />
                      ) : (
                        <Clock size={12} color={colors.textSecondary} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.timelineLabel,
                        { color: step.active ? colors.textPrimary : colors.textSecondary },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Edit Form (Landlord only, status === draft or brand new) */}
        {isOwner && status === "draft" ? (
          <Card style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Configure Agreement Terms</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Monthly Rent (INR)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.input }]}
                keyboardType="numeric"
                value={rentAmount}
                onChangeText={setRentAmount}
                placeholder="Monthly rent amount"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Security Deposit (INR)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.input }]}
                keyboardType="numeric"
                value={securityDeposit}
                onChangeText={setSecurityDeposit}
                placeholder="Refundable security deposit"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Lease Start Date</Text>
              <Pressable
                onPress={() => setShowStartPicker(true)}
                style={[styles.dateSelector, { borderColor: colors.border, backgroundColor: colors.input }]}
              >
                <Calendar size={18} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, marginLeft: 8 }}>{startDate.toLocaleDateString()}</Text>
              </Pressable>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  onChange={(_, d) => {
                    setShowStartPicker(false);
                    if (d) setStartDate(d);
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Lease End Date</Text>
              <Pressable
                onPress={() => setShowEndPicker(true)}
                style={[styles.dateSelector, { borderColor: colors.border, backgroundColor: colors.input }]}
              >
                <Calendar size={18} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, marginLeft: 8 }}>{endDate.toLocaleDateString()}</Text>
              </Pressable>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  onChange={(_, d) => {
                    setShowEndPicker(false);
                    if (d) setEndDate(d);
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Notice Period (Days)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.input }]}
                keyboardType="numeric"
                value={noticePeriod}
                onChangeText={setNoticePeriod}
                placeholder="Notice period in days"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Additional Clauses</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.input }]}
                multiline
                numberOfLines={4}
                value={additionalClauses}
                onChangeText={setAdditionalClauses}
                placeholder="Enter any additional rules or agreement clauses..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.actionRow}>
              <AppButton onPress={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? <ActivityIndicator size="small" color="#ffffff" /> : "Save Terms"}
              </AppButton>
              {lease && (
                <AppButton onPress={handleSendDraft} variant="primary" disabled={saving} style={{ flex: 1, backgroundColor: colors.success, borderColor: colors.success }}>
                  Send to Tenant
                </AppButton>
              )}
            </View>
          </Card>
        ) : null}

        {/* Read-only Document Preview Sheet */}
        {lease && (isOwner === false || status !== "draft") ? (
          <View style={[styles.previewSheet, { backgroundColor: "#ffffff", shadowColor: "#000" }]}>
            <Text style={styles.documentHeader}>RESIDENTIAL LEASE AGREEMENT</Text>
            <Text style={styles.documentDisclaimer}>
              Disclaimer: This is a convenient digital draft and does not replace local legal review.
            </Text>

            <View style={styles.documentSection}>
              <Text style={styles.documentSecTitle}>1. CONTRACT PARTIES</Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Landlord Name:</Text> {lease.ownerId?.name || "Landlord"}
              </Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Landlord Contact:</Text> {lease.ownerId?.phone || lease.ownerId?.email || "-"}
              </Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Tenant Name:</Text> {lease.tenantId?.name || "Tenant"}
              </Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Tenant Contact:</Text> {lease.tenantId?.phone || lease.tenantId?.email || "-"}
              </Text>
            </View>

            <View style={styles.documentSection}>
              <Text style={styles.documentSecTitle}>2. PREMISES LOCATION</Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Property:</Text> {lease.propertyId?.title || "Residential Unit"}
              </Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Address:</Text> {lease.propertyId?.address || ""}, {lease.propertyId?.city || ""}
              </Text>
            </View>

            <View style={styles.documentSection}>
              <Text style={styles.documentSecTitle}>3. LEASE TERMS & PAYMENTS</Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Monthly Rent:</Text> INR {lease.terms.rentAmount}
              </Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Security Deposit:</Text> INR {lease.terms.securityDeposit || 0}
              </Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Lease Start Date:</Text> {new Date(lease.terms.leaseStartDate).toLocaleDateString()}
              </Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Lease End Date:</Text> {new Date(lease.terms.leaseEndDate).toLocaleDateString()}
              </Text>
              <Text style={styles.documentText}>
                <Text style={{ fontWeight: "700" }}>Notice Period:</Text> {lease.terms.noticePeriodDays} Days
              </Text>
            </View>

            {lease.terms.additionalClauses ? (
              <View style={styles.documentSection}>
                <Text style={styles.documentSecTitle}>4. ADDITIONAL CLAUSES</Text>
                <Text style={styles.documentText}>{lease.terms.additionalClauses}</Text>
              </View>
            ) : null}

            {/* Signature Displays */}
            <View style={[styles.documentSection, styles.signatureRow]}>
              <View style={styles.sigCol}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#6b7280" }}>TENANT SIGNATURE</Text>
                {lease.tenantSignature ? (
                  <View style={styles.sigFrame}>
                    <Text style={styles.digitalSigText}>✓ Digitally Signed</Text>
                    <Text style={{ fontSize: 8, color: "#9ca3af" }}>
                      {new Date(lease.signedAtTenant || "").toLocaleDateString()}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.unsignedText}>Pending Signature</Text>
                )}
              </View>
              <View style={styles.sigCol}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#6b7280" }}>LANDLORD SIGNATURE</Text>
                {lease.ownerSignature ? (
                  <View style={styles.sigFrame}>
                    <Text style={styles.digitalSigText}>✓ Digitally Signed</Text>
                    <Text style={{ fontSize: 8, color: "#9ca3af" }}>
                      {new Date(lease.signedAtOwner || "").toLocaleDateString()}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.unsignedText}>Pending Signature</Text>
                )}
              </View>
            </View>
          </View>
        ) : null}

        {/* User signature trigger button */}
        {lease && canUserSign() && (
          <AppButton
            onPress={() => setIsSignModalVisible(true)}
            style={styles.floatingActionBtn}
            disabled={saving}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <FileSignature size={18} color="#ffffff" />
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>Sign Lease Agreement</Text>
            </View>
          </AppButton>
        )}

        {/* Completed status: download PDF */}
        {lease && status === "completed" && (
          <AppButton
            onPress={handleDownloadPDF}
            style={[styles.floatingActionBtn, { backgroundColor: colors.success, borderColor: colors.success }]}
            variant="primary"
            disabled={saving}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Download size={18} color="#ffffff" />
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>Download Signed Lease (PDF)</Text>
            </View>
          </AppButton>
        )}

        {/* Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Signature Canvas Drawing Modal */}
      <Modal
        visible={isSignModalVisible}
        animationType="slide"
        onRequestClose={() => setIsSignModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
          <View style={styles.signatureHeader}>
            <Text style={styles.signatureTitle}>Draw Signature</Text>
            <Pressable onPress={() => setIsSignModalVisible(false)} style={styles.closeModalBtn}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.error }}>Cancel</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1, position: "relative" }}>
            <SignatureScreen
              onOK={handleOK}
              onEmpty={() => console.log("empty")}
              descriptionText="Please draw your signature above inside the white area"
              clearText="Clear"
              confirmText="Confirm & Sign"
              webStyle={`.m-signature-pad { box-shadow: none; border: none; }
                        .m-signature-pad--body { border: 1px solid #e5e7eb; }`}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  loaderText: {
    fontSize: 14,
    marginTop: 8,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
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
    fontSize: 11,
    marginTop: 2,
    fontWeight: "700",
  },
  scrollContainer: {
    padding: 16,
  },
  timelineCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  timeline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  timelineStep: {
    alignItems: "center",
    zIndex: 10,
  },
  timelineIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    marginTop: -14, // align with circle centers
    marginHorizontal: -4,
  },
  formCard: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  multilineInput: {
    height: 100,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  previewSheet: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 20,
  },
  documentHeader: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    color: "#1f2937",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  documentDisclaimer: {
    fontSize: 8,
    textAlign: "center",
    color: "#9ca3af",
    marginBottom: 24,
  },
  documentSection: {
    marginBottom: 18,
  },
  documentSecTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3b82f6",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 4,
  },
  documentText: {
    fontSize: 11,
    color: "#4b5563",
    lineHeight: 18,
    marginBottom: 4,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  sigCol: {
    width: "48%",
  },
  sigFrame: {
    height: 60,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    backgroundColor: "#f9fafb",
  },
  digitalSigText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "800",
  },
  unsignedText: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 12,
  },
  floatingActionBtn: {
    marginVertical: 10,
    height: 48,
    justifyContent: "center",
  },
  signatureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  signatureTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  closeModalBtn: {
    padding: 6,
  },
});
