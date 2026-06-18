import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { FileText, Download, X } from "lucide-react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useTheme } from "../../theme/useTheme";

const { width } = Dimensions.get("window");

type Message = {
  _id: string;
  sender: string | { _id: string; name: string };
  text: string;
  createdAt: string;
  read: boolean;
  pending?: boolean;
  type?: string;
  image?: string;
  file?: {
    originalName?: string;
    filename?: string;
    mimetype?: string;
    size?: number;
    url?: string;
  };
  attachment?: {
    url?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
  };
};

interface MessageBubbleProps {
  item: Message;
  currentUserId: string;
  formatTime: (dateStr?: string) => string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  item,
  currentUserId,
  formatTime,
}) => {
  const { colors } = useTheme();
  const [downloading, setDownloading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const senderId = typeof item.sender === "object" ? item.sender._id : item.sender;
  const isMine = senderId === currentUserId;

  // Resolve attachment data
  const fileUrl = item.file?.url || item.attachment?.url || item.image;
  const filename =
    item.file?.originalName ||
    item.file?.filename ||
    item.attachment?.filename ||
    "Attachment";
  const mimetype = item.file?.mimetype || item.attachment?.mimeType;
  const size = item.file?.size || item.attachment?.size;

  const isImage =
    item.type === "image" ||
    mimetype?.startsWith("image/") ||
    (fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl));

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    setDownloading(true);
    try {
      const extension = filename.split(".").pop() || "bin";
      const localUri = FileSystem.cacheDirectory + `Renters_${Date.now()}.${extension}`;

      const { uri } = await FileSystem.downloadAsync(fileUrl, localUri);

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Downloaded", `File downloaded to temporary storage: ${uri}`);
      }
    } catch (error) {
      console.error("Download failed:", error);
      Alert.alert("Error", "Failed to download file attachment.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
      <View
        style={[
          styles.msgBubble,
          isMine
            ? [styles.msgBubbleMine, { backgroundColor: colors.primary }]
            : [styles.msgBubbleOther, { backgroundColor: colors.surface, borderColor: colors.border }],
          item.pending && { opacity: 0.6 },
        ]}
      >
        {/* Render Image Attachment */}
        {isImage && fileUrl && (
          <TouchableOpacity
            onPress={() => setImageModalVisible(true)}
            activeOpacity={0.9}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: fileUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Render Document Attachment */}
        {!isImage && fileUrl && (
          <View
            style={[
              styles.fileCard,
              {
                backgroundColor: isMine ? "rgba(255,255,255,0.15)" : colors.input,
                borderColor: isMine ? "rgba(255,255,255,0.25)" : colors.border,
              },
            ]}
          >
            <FileText size={24} color={isMine ? "#fff" : colors.textPrimary} />
            <View style={styles.fileInfo}>
              <Text
                style={[styles.fileName, { color: isMine ? "#fff" : colors.textPrimary }]}
                numberOfLines={1}
              >
                {filename}
              </Text>
              {size && (
                <Text
                  style={[
                    styles.fileSize,
                    { color: isMine ? "rgba(255,255,255,0.7)" : colors.textSecondary },
                  ]}
                >
                  {formatFileSize(size)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading}
              style={[
                styles.fileAction,
                { backgroundColor: isMine ? "rgba(255,255,255,0.2)" : colors.border },
              ]}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={isMine ? "#fff" : colors.primary} />
              ) : (
                <Download size={16} color={isMine ? "#fff" : colors.textPrimary} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Render Message Text */}
        {item.text ? (
          <Text style={[styles.msgText, { color: isMine ? "#fff" : colors.textPrimary }]}>
            {item.text}
          </Text>
        ) : null}

        {/* Timestamp & Pending Status */}
        <Text
          style={[
            styles.msgTime,
            { color: isMine ? "rgba(255,255,255,0.7)" : colors.textSecondary },
          ]}
        >
          {formatTime(item.createdAt)}
          {item.pending ? " ·· sending" : ""}
        </Text>
      </View>

      {/* Image Preview Modal */}
      {isImage && fileUrl && (
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImageModalVisible(false)}
            >
              <X size={28} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: fileUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  msgRow: {
    marginTop: 8,
  },
  msgRowMine: {
    alignItems: "flex-end",
  },
  msgRowOther: {
    alignItems: "flex-start",
  },
  msgBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleMine: {
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  imageContainer: {
    marginBottom: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  messageImage: {
    width: width * 0.55,
    height: width * 0.45,
    borderRadius: 12,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    gap: 8,
    width: width * 0.58,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: "600",
  },
  fileSize: {
    fontSize: 11,
    marginTop: 1,
  },
  fileAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  msgText: {
    fontSize: 15,
    lineHeight: 21,
  },
  msgTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  modalImage: {
    width: "100%",
    height: "80%",
  },
});

export default MessageBubble;
