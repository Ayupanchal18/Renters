import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { ChevronDown } from 'lucide-react-native';
import { radius as tokenRadius, spacing } from '@shared/theme/tokens';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export default function Select({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Select option',
  error,
}: SelectProps) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}

      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.error : colors.border,
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={[styles.triggerText, { color: selectedOption ? colors.textPrimary : colors.textSecondary }]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={colors.textSecondary} />
      </Pressable>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayDismiss} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <SafeAreaView style={styles.safeArea}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{label || 'Select option'}</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text>
                </Pressable>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  const isSelected = item.value === value;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.optionItem,
                        { borderBottomColor: colors.border },
                        isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        onValueChange(item.value);
                        setModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.textPrimary },
                          isSelected && { color: colors.primary, fontWeight: '700' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  trigger: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: tokenRadius.md + 4, // 12px
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: 16,
    flex: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayDismiss: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '50%',
  },
  safeArea: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 0.5,
  },
  optionText: {
    fontSize: 16,
  },
});
