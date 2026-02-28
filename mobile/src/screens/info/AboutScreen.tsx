import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield, Users, MapPin } from 'lucide-react-native';
import { colors } from '../../theme/tokens';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

export default function AboutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800' }} 
          style={styles.heroImage} 
        />
        
        <View style={styles.section}>
          <Text style={styles.title}>Our Mission</Text>
          <Text style={styles.prose}>
            At Renters, our mission is to simplify the process of finding your perfect home. 
            We believe that everyone deserves a seamless, transparent, and hassle-free experience 
            when looking for a place to rent or buy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Why We're Different</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.iconWrap}><Shield size={20} color={colors.primary} /></View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>100% Verified Listings</Text>
              <Text style={styles.featureDesc}>Every single property is physically or digitally verified by our team before it goes live.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.iconWrap}><Users size={20} color={colors.primary} /></View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Zero Brokerage</Text>
              <Text style={styles.featureDesc}>Connect directly with genuine owners. Avoid middleman fees completely.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.iconWrap}><MapPin size={20} color={colors.primary} /></View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Hyper-local Matches</Text>
              <Text style={styles.featureDesc}>Advanced filter systems let you pinpoint an apartment down to the distance from your office.</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Our Story</Text>
          <Text style={styles.prose}>
            Founded in 2024, Renters was born out of personal frustration with the existing 
            real estate portals. Fake listings, hidden broker fees, and outdated photos were 
            the norm. We set out to change that by building a platform rooted in transparency, 
            trust, and technology.
          </Text>
          <Text style={styles.prose}>
            Today, we help thousands of people across major metropolitan cities discover 
            flats, houses, and PGs that they can call home.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 8, marginLeft: -8, width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  heroImage: { width: '100%', height: 200, backgroundColor: colors.border },
  section: { padding: 20, paddingBottom: 0 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  prose: { fontSize: 15, color: colors.textSecondary, lineHeight: 24, marginBottom: 16 },
  featureRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '1A',
    alignItems: 'center', justifyContent: 'center'
  },
  featureTextWrap: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  featureDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
