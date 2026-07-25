import React, { useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, Linking } from "react-native";
import { Shield, Lock, EyeOff, Scale, Copyright, Cookie, Accessibility, ShieldAlert, TrendingUp, FileText, ChevronRight } from "lucide-react-native";
import AppScreen from "../../components/layout/AppScreen";
import { useTheme } from "../../theme/useTheme";

type PolicyKey = "do-not-sell" | "fair-housing" | "dmca" | "cookies" | "accessibility" | "scams" | "privacy" | "terms" | "investors";

interface PolicyItem {
  id: PolicyKey;
  title: string;
  subtitle: string;
  icon: any;
  content: string;
}

const POLICIES: PolicyItem[] = [
  {
    id: "do-not-sell",
    title: "Do Not Sell My Info",
    subtitle: "DPDP Act 2023 Statutory Rights",
    icon: EyeOff,
    content: "Under Sections 5, 6, 11, 12, & 13 of the Digital Personal Data Protection (DPDP) Act 2023, Renters Real Estate Services Pvt. Ltd. acts as a Data Fiduciary. We strictly prohibit selling or trading user KYC or personal numbers to data brokers. You hold statutory rights to withdraw marketing consent, request data summary access, or trigger complete data erasure. DPO Contact: dpo@renters.com (SLA: 48h acknowledgment, 7-15 days resolution)."
  },
  {
    id: "fair-housing",
    title: "Fair Housing Policy",
    subtitle: "Constitutional Equal Opportunity",
    icon: Scale,
    content: "Rooted in Articles 14 & 15 of the Constitution of India, Renters mandates zero-tolerance against housing discrimination based on religion, gender, caste, marital status (bachelors/families), food preferences (veg/non-veg), or profession. Discriminatory listing copy is auto-purged, and violators face account bans."
  },
  {
    id: "dmca",
    title: "DMCA & Copyright Policy",
    subtitle: "Copyright Act 1957 Takedown SLA",
    icon: Copyright,
    content: "All property photography, 3D renders, and floor plans are protected under Section 63 of the Indian Copyright Act, 1957. Pursuant to Rule 3 of the IT Intermediary Rules 2021, statutory takedown notices submitted to dmca@renters.com will result in content access removal within 24 to 36 hours."
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    subtitle: "E-Commerce Rules 2020 Consent",
    icon: Cookie,
    content: "Under Rule 4(2) of the Consumer Protection (E-Commerce) Rules 2020, non-essential cookies require affirmative user opt-in. Essential session cookies are used for login tokens and dark mode preferences. You can adjust your consent preferences anytime."
  },
  {
    id: "accessibility",
    title: "Accessibility Statement",
    subtitle: "RPwD Act 2016 & WCAG 2.1 AA",
    icon: Accessibility,
    content: "Committed to digital inclusion under the Rights of Persons with Disabilities (RPwD) Act 2016 and WCAG 2.1 AA standards. Features include full screen reader support, keyboard navigation, and high contrast visual modes. Accessibility Nodal Officer: accessibility@renters.com."
  },
  {
    id: "scams",
    title: "Avoid Rental Scams",
    subtitle: "Cyber Crime Helpline 1930 & I4C Rules",
    icon: ShieldAlert,
    content: "In alignment with the Indian Cyber Crime Coordination Centre (I4C):\n1. Never scan QR codes to receive money.\n2. Beware of military ID imposter scams.\n3. Never pay advance gate-pass/visiting money.\n4. Always inspect property in person.\n5. Dial National Cyber Helpline 1930 immediately if defrauded."
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    subtitle: "DPDP 2023 & AES-256 Storage",
    icon: Lock,
    content: "Data in transit is encrypted via TLS 1.3, and databases employ AES-256 encryption at rest on Indian servers. Read statutory data principal rights and Data Protection Officer disclosures at renters.com/privacy-policy."
  },
  {
    id: "terms",
    title: "Terms of Use",
    subtitle: "RERA Sec 2(zm) & IT Act Sec 79",
    icon: FileText,
    content: "Renters acts exclusively as an online listing platform and IT Intermediary under Section 2(zm) of the RERA Act 2016 and Section 79 of the IT Act 2000. Promoters must disclose valid State RERA numbers. Users must independently verify project approvals on State RERA portals."
  },
  {
    id: "investors",
    title: "Investors & Corporate Info",
    subtitle: "MCA Corporate Disclosures & CIN",
    icon: TrendingUp,
    content: "Renters Real Estate Services Pvt. Ltd. (CIN: U70100MH2024PTC987654) operates across 100+ Indian cities with 50,000+ active listings. Corporate Office: Mumbai, India. Investor Contact: investors@renters.com."
  }
];

export default function LegalPolicyScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [activePolicy, setActivePolicy] = useState<PolicyKey>("do-not-sell");

  const current = POLICIES.find(p => p.id === activePolicy) || POLICIES[0];

  return (
    <AppScreen title="Legal & Policies" subtitle="Renters.com • All Rights Reserved" showBack>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Horizontal Policy Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {POLICIES.map((p) => {
            const Icon = p.icon;
            const isSelected = p.id === activePolicy;
            return (
              <Pressable
                key={p.id}
                onPress={() => setActivePolicy(p.id)}
                style={[
                  styles.tabChip,
                  isSelected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border }
                ]}
              >
                <Icon size={14} color={isSelected ? "#ffffff" : colors.textSecondary} />
                <Text style={[styles.tabChipText, isSelected ? { color: "#ffffff" } : { color: colors.textSecondary }]}>
                  {p.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected Policy Detail Card */}
        <View style={styles.policyCard}>
          <View style={styles.headerRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
              <current.icon size={24} color={colors.primary} />
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.cardTitle}>{current.title}</Text>
              <Text style={styles.cardSubtitle}>{current.subtitle}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.bodyText}>{current.content}</Text>

          <Pressable
            style={styles.webLinkBtn}
            onPress={() => Linking.openURL(`https://renters.com/${current.id}`)}
          >
            <Text style={styles.webLinkText}>View Full Policy Document on Web</Text>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* All Rights Reserved Banner */}
        <View style={styles.rightsBanner}>
          <Text style={styles.rightsText}>© 2026 Renters.com • All Rights Reserved</Text>
          <Text style={styles.subRightsText}>Compliant with Indian DPDP Act 2023 & RERA Guidelines</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 40 },
    tabsScroll: { marginVertical: 12 },
    tabsContent: { paddingHorizontal: 4, gap: 8 },
    tabChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.surface,
    },
    tabChipText: { fontSize: 12, fontWeight: "700" },
    policyCard: {
      marginHorizontal: 4,
      marginTop: 8,
      padding: 18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.surface,
    },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    titleWrap: { flex: 1 },
    cardTitle: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
    cardSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
    bodyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
    webLinkBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    webLinkText: { fontSize: 12, fontWeight: "700", color: colors.primary },
    rightsBanner: { marginTop: 20, alignItems: "center" },
    rightsText: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
    subRightsText: { fontSize: 10, color: colors.textSecondary, marginTop: 3 },
  });
