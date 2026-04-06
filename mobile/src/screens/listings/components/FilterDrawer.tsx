import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, SlidersHorizontal, Home, Building2, Bed, Wallet, Sofa, Users, Calendar, Banknote, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../../theme/useTheme';
import AppButton from '../../../components/ui/AppButton';

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
  type: 'rent' | 'buy';
}

const PROPERTY_TYPES = [
  { value: 'room', label: 'Room' },
  { value: 'flat', label: 'Flat' },
  { value: 'house', label: 'House' },
  { value: 'pg', label: 'PG' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'commercial', label: 'Comm.' }
];

const FURNISHING = [
  { value: 'unfurnished', label: 'Unf.' },
  { value: 'semi', label: 'Semi' },
  { value: 'fully', label: 'Full' }
];

const TENANTS = [
  { value: 'family', label: 'Family' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'any', label: 'Any' }
];

const POSSESSION = [
  { value: 'ready', label: 'Ready' },
  { value: 'under_construction', label: 'U.C.' },
  { value: 'resale', label: 'Resale' }
];

const AMENITIES = ["Parking", "Garden", "Swimming Pool", "Gym", "Clubhouse", "Security", "Power Backup", "Lift", "Wifi", "AC"];

export default function FilterDrawer({ visible, onClose, onApply, currentFilters, type }: FilterDrawerProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [filters, setFilters] = useState<any>(currentFilters || {});

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [currentFilters, visible]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const themeColor = type === 'buy' ? colors.success : colors.primary;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.input, borderColor: themeColor }]}>
                <SlidersHorizontal size={18} color={themeColor} />
              </View>
              <Text style={styles.headerTitle}>{type === 'buy' ? 'Buy Filters' : 'Rent Filters'}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Wallet size={16} color={colors.textSecondary} />
                <Text style={styles.sectionTitle}>{type === 'rent' ? 'Monthly Budget' : 'Price Range'}</Text>
              </View>
              <View style={styles.priceInputs}>
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Min</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.currency}>₹</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary + '80'}
                      keyboardType="numeric"
                      value={String(filters[type === 'rent' ? 'minRent' : 'minPrice'] || '')}
                      onChangeText={(v) => setFilters({ ...filters, [type === 'rent' ? 'minRent' : 'minPrice']: v })}
                    />
                  </View>
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Max</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.currency}>₹</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Any"
                      placeholderTextColor={colors.textSecondary + '80'}
                      keyboardType="numeric"
                      value={String(filters[type === 'rent' ? 'maxRent' : 'maxPrice'] || '')}
                      onChangeText={(v) => setFilters({ ...filters, [type === 'rent' ? 'maxRent' : 'maxPrice']: v })}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Property Type */}
            <View style={styles.section}>
               <View style={styles.sectionHeader}>
                <Building2 size={16} color={colors.textSecondary} />
                <Text style={styles.sectionTitle}>Property Type</Text>
              </View>
              <View style={styles.pillContainer}>
                {PROPERTY_TYPES.map(opt => {
                  const isActive = filters.category === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.pill, isActive && { borderColor: themeColor, backgroundColor: themeColor + '0D' }]}
                      onPress={() => setFilters({ ...filters, category: isActive ? undefined : opt.value })}
                    >
                      <Text style={[styles.pillText, isActive && { color: themeColor, fontWeight: '700' }]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Bedrooms */}
             <View style={styles.section}>
               <View style={styles.sectionHeader}>
                <Bed size={16} color={colors.textSecondary} />
                <Text style={styles.sectionTitle}>Bedrooms (BHK)</Text>
              </View>
              <View style={styles.pillContainer}>
                {['1', '2', '3', '4', '5+'].map(num => {
                   const isActive = (filters.bedrooms?.split(',') || []).includes(num);
                  return (
                    <Pressable
                      key={num}
                      style={[styles.pill, isActive && { borderColor: themeColor, backgroundColor: themeColor + '0D' }]}
                      onPress={() => {
                        const current = filters.bedrooms?.split(',').filter(Boolean) || [];
                        const newList = isActive ? current.filter((v:any) => v !== num) : [...current, num];
                        setFilters({ ...filters, bedrooms: newList.length ? newList.join(',') : undefined });
                      }}
                    >
                      <Text style={[styles.pillText, isActive && { color: themeColor, fontWeight: '700' }]}>{num} BHK</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {type === 'rent' ? (
              <>
                {/* Furnishing */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Sofa size={16} color={colors.textSecondary} />
                    <Text style={styles.sectionTitle}>Furnishing</Text>
                  </View>
                  <View style={styles.pillContainer}>
                    {FURNISHING.map(opt => {
                      const isActive = filters.furnishing === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          style={[styles.pill, isActive && { borderColor: themeColor, backgroundColor: themeColor + '0D' }]}
                          onPress={() => setFilters({ ...filters, furnishing: isActive ? undefined : opt.value })}
                        >
                          <Text style={[styles.pillText, isActive && { color: themeColor, fontWeight: '700' }]}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                {/* Tenants */}
                <View style={styles.section}>
                   <View style={styles.sectionHeader}>
                    <Users size={16} color={colors.textSecondary} />
                    <Text style={styles.sectionTitle}>Preferred Tenants</Text>
                  </View>
                  <View style={styles.pillContainer}>
                    {TENANTS.map(opt => {
                      const isActive = filters.preferredTenants === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          style={[styles.pill, isActive && { borderColor: themeColor, backgroundColor: themeColor + '0D' }]}
                          onPress={() => setFilters({ ...filters, preferredTenants: isActive ? undefined : opt.value })}
                        >
                          <Text style={[styles.pillText, isActive && { color: themeColor, fontWeight: '700' }]}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Possession */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={styles.sectionTitle}>Possession Status</Text>
                  </View>
                  <View style={styles.pillContainer}>
                    {POSSESSION.map(opt => {
                      const isActive = filters.possessionStatus === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          style={[styles.pill, isActive && { borderColor: themeColor, backgroundColor: themeColor + '0D' }]}
                          onPress={() => setFilters({ ...filters, possessionStatus: isActive ? undefined : opt.value })}
                        >
                          <Text style={[styles.pillText, isActive && { color: themeColor, fontWeight: '700' }]}>{opt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                 {/* Loan */}
                 <View style={styles.section}>
                   <View style={styles.sectionHeader}>
                    <Banknote size={16} color={colors.textSecondary} />
                    <Text style={styles.sectionTitle}>Home Loan Available</Text>
                  </View>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Filter for Loan Approved properties</Text>
                    <Switch 
                      value={filters.loanAvailable} 
                      onValueChange={(v) => setFilters({...filters, loanAvailable: v})} 
                      trackColor={{ false: '#d1d5db', true: colors.success }}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Amenities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.pillContainer}>
                {AMENITIES.map(amen => {
                  const isActive = (filters.amenities?.split(',') || []).includes(amen);
                  return (
                    <Pressable
                      key={amen}
                      style={[styles.pill, isActive && { borderColor: themeColor, backgroundColor: themeColor + '0D' }]}
                      onPress={() => {
                         const current = filters.amenities?.split(',').filter(Boolean) || [];
                         const newList = isActive ? current.filter((v:any) => v !== amen) : [...current, amen];
                         setFilters({ ...filters, amenities: newList.length ? newList.join(',') : undefined });
                      }}
                    >
                      <Text style={[styles.pillText, isActive && { color: themeColor, fontWeight: '700' }]}>{amen}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Verified Only */}
            <View style={[styles.section, filters.verified && { backgroundColor: isDark ? colors.success + '1A' : '#f0fdf4', borderColor: colors.success }]}>
              <View style={styles.verifiedRow}>
                 <View style={styles.verifiedInfo}>
                    <ShieldCheck size={20} color={filters.verified ? colors.success : colors.textSecondary} />
                    <View>
                       <Text style={[styles.verifiedTitle, filters.verified && { color: colors.success }]}>Verified Only</Text>
                       <Text style={[styles.verifiedSubtitle, filters.verified && { color: colors.success + '99' }]}>Show only verified listings</Text>
                    </View>
                 </View>
                 <Switch 
                   value={filters.verified} 
                   onValueChange={(v) => setFilters({...filters, verified: v})}
                   trackColor={{ false: '#d1d5db', true: colors.success }}
                 />
              </View>
            </View>

          </ScrollView>

          <View style={styles.footer}>
            <AppButton variant="secondary" onPress={handleClear} style={styles.clearBtn} textStyle={{ color: colors.textPrimary }}>
              Clear
            </AppButton>
            <AppButton onPress={handleApply} style={[styles.applyBtn, { backgroundColor: themeColor }]}>
              Show Results
            </AppButton>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { padding: 8 },
  scrollContent: { padding: 20 },
  section: { marginBottom: 24, padding: 4, borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  priceInputs: { flexDirection: 'row', gap: 12 },
  inputBox: { flex: 1, gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', marginLeft: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, paddingLeft: 12 },
  currency: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  input: { flex: 1, height: 44, paddingHorizontal: 8, fontSize: 15, color: colors.textPrimary },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  pillText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.input, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  toggleLabel: { fontSize: 14, color: colors.textSecondary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifiedInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifiedTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  verifiedSubtitle: { fontSize: 12, color: colors.textSecondary },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, gap: 12 },
  clearBtn: { flex: 1 },
  applyBtn: { flex: 2 },
});
