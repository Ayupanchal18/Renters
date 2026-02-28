import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import AppButton from './AppButton';
import { colors } from '../../theme/tokens';
import type { Property } from '../../types/types';

interface MobileContactBarProps {
  property: Property;
  onMessage: () => void;
  onCall: () => void;
  isCreatingConversation?: boolean;
}

export default function MobileContactBar({ property, onMessage, onCall, isCreatingConversation }: MobileContactBarProps) {
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return null;
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const isRent = property.listingType === 'rent';
  const price = isRent ? property.monthlyRent : property.sellingPrice;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              ₹{formatCurrency(price)}
            </Text>
            {isRent && <Text style={styles.priceSuffix}>/mo</Text>}
          </View>
          {(property.rentNegotiable || property.negotiable) && (
            <Text style={styles.negotiableText}>Negotiable</Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          <Pressable onPress={onCall} style={styles.callWrap}>
            <Text style={styles.callIcon}>📞</Text>
          </Pressable>
          
          <Pressable 
            onPress={onMessage} 
            disabled={isCreatingConversation}
            style={styles.messageButton}
          >
            <Text style={styles.messageText}>
              {isCreatingConversation ? 'Starting...' : 'Message'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16, // Extra padding for iOS swipe bar
    zIndex: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  priceContainer: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  priceSuffix: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  negotiableText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066FF',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  callWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  callIcon: {
    fontSize: 20,
  },
  messageButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
