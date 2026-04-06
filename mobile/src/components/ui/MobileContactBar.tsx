import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Phone, MessageCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/useTheme';
import type { Property } from '../../types/types';

interface MobileContactBarProps {
  property: Property;
  onMessage: () => void;
  onCall: () => void;
  isCreatingConversation?: boolean;
}

export default function MobileContactBar({ property, onMessage, onCall, isCreatingConversation }: MobileContactBarProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <BlurView
        intensity={95}
        tint={isDark ? "dark" : "light"}
        style={styles.container}
      >
        <View style={styles.row}>
          <Pressable onPress={onCall} style={styles.contactButton}>
            <Phone size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.contactText}>Contact Seller</Text>
          </Pressable>

          <Pressable 
            onPress={onMessage} 
            disabled={isCreatingConversation}
            style={[styles.messageButton, isCreatingConversation && styles.messageButtonDisabled]}
          >
            <MessageCircle size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.messageText}>
              {isCreatingConversation ? 'Starting...' : 'Message'}
            </Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
  },
  container: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  contactText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  messageButton: {
    width: 120,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#14B8A6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonDisabled: {
    opacity: 0.6,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
