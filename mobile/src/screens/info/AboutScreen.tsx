import React, { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, Image } from "react-native";
import { Shield, Users, MapPin } from "lucide-react-native";
import AppScreen from "../../components/layout/AppScreen";
import { useTheme } from "../../theme/useTheme";

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <AppScreen title="About" subtitle="What makes Renters different" showBack>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
          }}
          style={styles.heroImage}
        />

        <View style={styles.section}>
          <Text style={styles.title}>Our Mission</Text>
          <Text style={styles.prose}>
            At Renters, our mission is to simplify the process of finding your perfect home. We believe that everyone
            deserves a seamless, transparent, and hassle-free experience when looking for a place to rent or buy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Why We're Different</Text>

          <View style={styles.featureRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
              <Shield size={20} color="#ffffff" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Verified listings</Text>
              <Text style={styles.featureDesc}>
                Every property is verified by our team before it goes live, so you can browse with confidence.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.success }]}>
              <Users size={20} color="#ffffff" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Zero brokerage</Text>
              <Text style={styles.featureDesc}>
                Connect directly with genuine owners and agents—no middleman fees and no surprises.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
              <MapPin size={20} color="#ffffff" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureTitle}>Hyper-local matches</Text>
              <Text style={styles.featureDesc}>
                Powerful filters help you pinpoint the right place—down to the neighborhood and commute.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Our Story</Text>
          <Text style={styles.prose}>
            Founded in 2024, Renters was born out of frustration with fake listings, hidden fees, and outdated photos.
            We set out to build a platform rooted in transparency, trust, and modern technology.
          </Text>
          <Text style={styles.prose}>
            Today, we help thousands of people across major cities discover flats, houses, and PGs they can call home.
          </Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 40 },
    heroImage: { width: "100%", height: 200, backgroundColor: colors.border, borderRadius: 18 },
    section: { paddingHorizontal: 4, paddingTop: 16 },
    title: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, marginBottom: 10, letterSpacing: -0.2 },
    prose: { fontSize: 15, color: colors.textSecondary, lineHeight: 23, marginBottom: 12 },
    featureRow: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 14,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.surface,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    featureTextWrap: { flex: 1 },
    featureTitle: { fontSize: 15, fontWeight: "800", color: colors.textPrimary, marginBottom: 3 },
    featureDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  });
