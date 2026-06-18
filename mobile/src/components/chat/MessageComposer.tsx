import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Paperclip, Smile, Send, X, FileText } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "../../theme/useTheme";
import AnimatedPressable from "../ui/AnimatedPressable";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface MessageComposerProps {
  inputText: string;
  setInputText: (text: string) => void;
  selectedFile: any;
  setSelectedFile: (file: any) => void;
  sending: boolean;
  onSend: () => void;
  onEmojiPress: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  inputText,
  setInputText,
  selectedFile,
  setSelectedFile,
  sending,
  onSend,
  onEmojiPress,
}) => {
  const { colors } = useTheme();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handlePickAttachment = () => {
    Alert.alert(
      "Add Attachment",
      "Choose the source of your attachment",
      [
        { text: "Take Photo", onPress: handleCamera },
        { text: "Choose from Gallery", onPress: handleGallery },
        { text: "Choose Document (PDF)", onPress: handleDocument },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert("File Too Large", "Images must be smaller than 10MB.");
          return;
        }
        setSelectedFile({
          uri: asset.uri,
          fileName: asset.fileName || "photo.jpg",
          mimeType: asset.mimeType || "image/jpeg",
          fileSize: asset.fileSize,
          isImage: true,
        });
      }
    } catch (error) {
      console.error("Camera capture failed:", error);
      Alert.alert("Error", "Could not launch camera.");
    }
  };

  const handleGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Photo library access is needed to select images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert("File Too Large", "Images must be smaller than 10MB.");
          return;
        }
        setSelectedFile({
          uri: asset.uri,
          fileName: asset.fileName || "photo.jpg",
          mimeType: asset.mimeType || "image/jpeg",
          fileSize: asset.fileSize,
          isImage: true,
        });
      }
    } catch (error) {
      console.error("Library pick failed:", error);
      Alert.alert("Error", "Could not pick image from gallery.");
    }
  };

  const handleDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.size && asset.size > MAX_FILE_SIZE) {
          Alert.alert("File Too Large", "Documents must be smaller than 10MB.");
          return;
        }
        setSelectedFile({
          uri: asset.uri,
          fileName: asset.name || "document.pdf",
          mimeType: asset.mimeType || "application/pdf",
          fileSize: asset.size,
          isImage: false,
        });
      }
    } catch (error) {
      console.error("Document pick failed:", error);
      Alert.alert("Error", "Could not pick document.");
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const isSendDisabled = !inputText.trim() && !selectedFile;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* File Preview Chip */}
      {selectedFile && (
        <View style={[styles.previewContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
          {selectedFile.isImage ? (
            <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
          ) : (
            <View style={[styles.previewFileIcon, { backgroundColor: colors.border }]}>
              <FileText size={20} color={colors.textPrimary} />
            </View>
          )}
          <View style={styles.previewInfo}>
            <Text style={[styles.previewName, { color: colors.textPrimary }]} numberOfLines={1}>
              {selectedFile.fileName}
            </Text>
            {selectedFile.fileSize && (
              <Text style={[styles.previewSize, { color: colors.textSecondary }]}>
                {formatFileSize(selectedFile.fileSize)}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClearFile} style={styles.previewClose}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handlePickAttachment}
          disabled={sending}
          style={styles.iconBtn}
        >
          <Paperclip size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.msgInput,
            {
              backgroundColor: colors.input,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
        />

        <TouchableOpacity
          onPress={onEmojiPress}
          disabled={sending}
          style={styles.iconBtn}
        >
          <Smile size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <AnimatedPressable
          onPress={onSend}
          disabled={sending || isSendDisabled}
          style={[
            styles.sendBtn,
            {
              backgroundColor: isSendDisabled ? colors.border : colors.primary,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={18} color="#fff" />
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  previewImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  previewFileIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewSize: {
    fontSize: 11,
    marginTop: 2,
  },
  previewClose: {
    padding: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  msgInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MessageComposer;
