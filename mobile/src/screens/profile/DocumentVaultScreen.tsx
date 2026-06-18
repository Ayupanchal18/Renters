import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, ShieldCheck, FileText, Upload, Trash2, Eye, HelpCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../features/auth/AuthContext";
import { vaultService, VaultDocument } from "../../features/vault/services/vaultService";
import { getAccessToken } from "../../features/auth/services/tokenStorage";
import AppButton from "../../components/ui/AppButton";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

type DocType = "id_proof" | "address_proof" | "income_proof" | "reference_letter" | "other";

interface DocTypeConfig {
  type: DocType;
  label: string;
  description: string;
  required: boolean;
}

const DOCUMENT_TYPES: DocTypeConfig[] = [
  {
    type: "id_proof",
    label: "Government ID Proof",
    description: "Passport, Aadhar Card, PAN Card, or Driver's License",
    required: true,
  },
  {
    type: "address_proof",
    label: "Address Proof",
    description: "Utility bill, Rent agreement, or Bank statement (last 3 months)",
    required: true,
  },
  {
    type: "income_proof",
    label: "Income Proof",
    description: "Salary slips (last 3 months) or Form 16 / ITR",
    required: false,
  },
  {
    type: "reference_letter",
    label: "Reference Letter",
    description: "Previous landlord or employer reference letter",
    required: false,
  },
  {
    type: "other",
    label: "Supporting Document",
    description: "Any other document to strengthen your profile",
    required: false,
  },
];

export default function DocumentVaultScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { user, updateSessionUser } = useAuth();

  // States
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingType, setActionLoadingType] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await vaultService.getDocuments();
      setDocuments(docs);
    } catch (error: any) {
      console.error("Error fetching vault documents:", error);
      Alert.alert("Error", "Failed to retrieve documents from the vault.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Map uploaded documents by type for easy lookup
  const docsMap = useMemo(() => {
    const map = new Map<DocType, VaultDocument>();
    documents.forEach((doc) => {
      // Keep only the most recent document for each type if duplicates exist
      if (!map.has(doc.type)) {
        map.set(doc.type, doc);
      }
    });
    return map;
  }, [documents]);

  // Calculations for verification status
  const verifiedCount = useMemo(() => {
    let count = 0;
    DOCUMENT_TYPES.forEach((cfg) => {
      if (cfg.required && docsMap.get(cfg.type)?.status === "verified") {
        count++;
      }
    });
    return count;
  }, [docsMap]);

  const requiredCount = DOCUMENT_TYPES.filter((c) => c.required).length; // 2
  const isFullyVerified = verifiedCount === requiredCount;

  // Image Picker Logic (Camera)
  const handleCamera = async (type: DocType) => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert("Permission Denied", "Please allow camera access in your settings to snap photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(type, result.assets[0].uri, "photo.jpg", "image/jpeg");
      }
    } catch (e) {
      console.error("Camera error:", e);
      Alert.alert("Error", "Could not capture image from camera.");
    }
  };

  // Image Picker Logic (Library)
  const handleLibrary = async (type: DocType) => {
    try {
      const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPerm.granted) {
        Alert.alert("Permission Denied", "Please allow gallery access in your settings to pick photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const filename = uri.split("/").pop() || "photo.jpg";
        await uploadFile(type, uri, filename, "image/jpeg");
      }
    } catch (e) {
      console.error("Library error:", e);
      Alert.alert("Error", "Could not pick image from gallery.");
    }
  };

  // Document Picker Logic (PDF)
  const handleDocumentPicker = async (type: DocType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        await uploadFile(type, file.uri, file.name, file.mimeType || "application/pdf");
      }
    } catch (e) {
      console.error("Document picker error:", e);
      Alert.alert("Error", "Could not select file.");
    }
  };

  // File upload wrapper
  const uploadFile = async (type: DocType, uri: string, filename: string, mimeType: string) => {
    setActionLoadingType(type);
    try {
      await vaultService.uploadDocument(type, uri, filename, mimeType);
      Alert.alert("Success", "Document uploaded successfully and is pending admin review.");
      await fetchDocuments();
    } catch (error: any) {
      console.error("Upload failed:", error);
      Alert.alert("Upload Failed", error.message || "Could not upload document. Please try again.");
    } finally {
      setActionLoadingType(null);
    }
  };

  // Action Sheet Selector
  const showUploadOptions = (type: DocType) => {
    const options = ["Take Photo", "Choose from Gallery", "Choose PDF / File", "Cancel"];
    const cancelButtonIndex = 3;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: "Upload Verification Document",
          message: "Please choose an option to upload your document",
        },
        (buttonIndex) => {
          if (buttonIndex === 0) handleCamera(type);
          else if (buttonIndex === 1) handleLibrary(type);
          else if (buttonIndex === 2) handleDocumentPicker(type);
        }
      );
    } else {
      Alert.alert(
        "Upload Document",
        "Choose file source",
        [
          { text: "Take Photo", onPress: () => handleCamera(type) },
          { text: "Gallery", onPress: () => handleLibrary(type) },
          { text: "PDF / Document", onPress: () => handleDocumentPicker(type) },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  // Secure View/Download Logic (Downloads to cache directory and shares)
  const handleViewFile = async (doc: VaultDocument) => {
    setDownloadingId(doc._id);
    try {
      const token = await getAccessToken();
      const localUri = `${FileSystem.cacheDirectory}${doc._id}_${doc.filename}`;

      const downloadResult = await FileSystem.downloadAsync(
        vaultService.getFileProxyUrl(doc._id),
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

      // Open Native Share Sheet (allows view, print, save, send)
      await Sharing.shareAsync(downloadResult.uri);
    } catch (err: any) {
      console.error("View file error:", err);
      Alert.alert("Download Failed", "Failed to retrieve the file from secure vault.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete document
  const handleDelete = (doc: VaultDocument) => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document from the vault?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await vaultService.deleteDocument(doc._id);
              Alert.alert("Success", "Document deleted from the vault.");
              await fetchDocuments();
            } catch (err: any) {
              console.error("Delete error:", err);
              Alert.alert("Error", err.message || "Failed to delete document.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Delete all verification data
  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete All Verification Data",
      "This will permanently delete all your pending and rejected vault documents. Verified documents cannot be deleted. Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Data",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Delete pending and rejected files
              const unverifiedDocs = documents.filter((d) => d.status !== "verified");
              for (const doc of unverifiedDocs) {
                await vaultService.deleteDocument(doc._id);
              }
              Alert.alert("Data Deleted", "Your unverified documents have been cleared.");
              await fetchDocuments();
            } catch (e) {
              console.error("Error cleaning vault data", e);
              Alert.alert("Error", "Could not clear all vault documents.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "verified") return <Badge variant="success">✓ Verified</Badge>;
    if (status === "pending") return <Badge variant="warning">⏳ Pending Review</Badge>;
    if (status === "rejected") return <Badge variant="destructive">✕ Rejected</Badge>;
    return <Badge variant="secondary">Not Uploaded</Badge>;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Document Vault</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Secure end-to-end encrypted document manager
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Info/Benefits Banner */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <ShieldCheck size={32} color={colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>Verification Status</Text>
              {isFullyVerified ? (
                <Text style={[styles.bannerDesc, { color: colors.success, fontWeight: "700" }]}>
                  ✓ Your profile is fully verified. You are pre-approved to sign leases!
                </Text>
              ) : (
                <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
                  Upload Government ID and Address Proof to get a verified badge and pre-approve yourself for leases.
                </Text>
              )}
            </View>
          </View>

          {/* Progress Meter */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                Required Verification Documents
              </Text>
              <Text style={[styles.progressVal, { color: colors.textPrimary }]}>
                {verifiedCount} of {requiredCount} Verified
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: isFullyVerified ? colors.success : colors.primary,
                    width: `${(verifiedCount / requiredCount) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </Card>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Retrieving documents...</Text>
          </View>
        ) : (
          <View style={styles.slotsContainer}>
            {DOCUMENT_TYPES.map((cfg) => {
              const uploadedDoc = docsMap.get(cfg.type);
              const isUploading = actionLoadingType === cfg.type;

              return (
                <Card key={cfg.type} style={styles.slotCard}>
                  <View style={styles.slotHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.slotTitle, { color: colors.textPrimary }]}>{cfg.label}</Text>
                        {cfg.required && <Text style={{ color: colors.error, fontWeight: "800" }}>*</Text>}
                      </View>
                      <Text style={[styles.slotDesc, { color: colors.textSecondary }]}>{cfg.description}</Text>
                    </View>
                    <View>{getStatusBadge(uploadedDoc?.status || "none")}</View>
                  </View>

                  {uploadedDoc && (
                    <View style={[styles.filePreview, { backgroundColor: colors.input, borderColor: colors.border }]}>
                      <FileText size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                      <Text style={[styles.filenameText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {uploadedDoc.filename}
                      </Text>
                    </View>
                  )}

                  {uploadedDoc?.status === "rejected" && uploadedDoc.rejectionReason ? (
                    <View style={[styles.rejectedBox, { backgroundColor: colors.error + "10", borderColor: colors.error }]}>
                      <Text style={[styles.rejectedText, { color: colors.error }]}>
                        Rejection Reason: "{uploadedDoc.rejectionReason}"
                      </Text>
                    </View>
                  ) : null}

                  {/* Slot action triggers */}
                  <View style={styles.slotActions}>
                    {isUploading ? (
                      <View style={{ paddingVertical: 8, flexDirection: "row", gap: 8, alignItems: "center" }}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Uploading file...</Text>
                      </View>
                    ) : (
                      <>
                        <AppButton
                          onPress={() => showUploadOptions(cfg.type)}
                          variant={uploadedDoc ? "secondary" : "primary"}
                          style={{ minWidth: 90 }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Upload size={12} color={uploadedDoc ? colors.textPrimary : "#ffffff"} />
                            <Text style={{ color: uploadedDoc ? colors.textPrimary : "#ffffff", fontWeight: "700", fontSize: 12 }}>
                              {uploadedDoc ? "Replace" : "Upload"}
                            </Text>
                          </View>
                        </AppButton>

                        {uploadedDoc && (
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable
                              onPress={() => handleViewFile(uploadedDoc)}
                              disabled={downloadingId === uploadedDoc._id}
                              style={[styles.actionBtn, { borderColor: colors.border }]}
                            >
                              {downloadingId === uploadedDoc._id ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                              ) : (
                                <Eye size={16} color={colors.textPrimary} />
                              )}
                            </Pressable>

                            {uploadedDoc.status !== "verified" && (
                              <Pressable
                                onPress={() => handleDelete(uploadedDoc)}
                                style={[styles.actionBtn, { borderColor: colors.border }]}
                              >
                                <Trash2 size={16} color={colors.error} />
                              </Pressable>
                            )}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Clear Data Policy Trigger */}
        {!loading && documents.some((d) => d.status !== "verified") && (
          <Pressable onPress={handleDeleteAllData} style={styles.clearAllBtn}>
            <Text style={[styles.clearAllBtnText, { color: colors.error }]}>Delete All Unverified Data</Text>
          </Pressable>
        )}

        {/* Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    fontSize: 12,
    marginTop: 2,
  },
  scrollContainer: {
    padding: 16,
  },
  bannerCard: {
    padding: 16,
    marginBottom: 20,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  bannerDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressVal: {
    fontSize: 11,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loaderText: {
    fontSize: 13,
    marginTop: 12,
    fontWeight: "600",
  },
  slotsContainer: {
    gap: 16,
  },
  slotCard: {
    padding: 16,
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  slotDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  filenameText: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  rejectedBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  rejectedText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  slotActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.03)",
    paddingTop: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clearAllBtn: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clearAllBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
