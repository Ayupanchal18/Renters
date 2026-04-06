import React, { useMemo } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import AppScreen from "../../components/layout/AppScreen";
import CollapsibleSection from "../../components/ui/CollapsibleSection";
import { useTheme } from "../../theme/useTheme";

const FAQ_DATA = [
  {
    k: "1",
    question: "Do I have to pay any brokerage?",
    answer: "No, Renters is a zero-brokerage platform. We connect tenants directly with verified owners, ensuring complete transparency and saving you money."
  },
  {
    k: "2",
    question: "How do you verify properties?",
    answer: "Every property goes through a multi-step verification process. This includes document verification of the owner and often physical or live video walkthroughs by our field team to ensure the photos match reality."
  },
  {
    k: "3",
    question: "Is the security deposit negotiable?",
    answer: "The security deposit depends completely on the owner. However, our filtering system highlights properties marked as 'Negotiable' if you want to negotiate terms."
  },
  {
    k: "4",
    question: "How can I contact an owner?",
    answer: "Once you create a free account, you can use the 'Message' or 'Call' buttons on any property detail page to connect directly with the owner without an intermediary."
  },
  {
    k: "5",
    question: "Can I list my own property?",
    answer: "Absolutely! Choose the 'Post Property' option on the website or app dashboard. We'll guide you through adding photos, setting terms, and getting verified."
  }
];

export default function FAQScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <AppScreen title="FAQs" subtitle="Quick answers to common questions" showBack>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroText}>Frequently Asked Questions</Text>
          <Text style={styles.subHeroText}>Everything you need to know about how Renters works.</Text>
        </View>

        <View style={styles.faqList}>
          {FAQ_DATA.map((faq) => (
            <CollapsibleSection key={faq.k} title={faq.question} defaultOpen={false}>
              <Text style={styles.answer}>{faq.answer}</Text>
            </CollapsibleSection>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const getStyles = (colors: any, _isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 4, paddingBottom: 40 },
    heroCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
    },
    heroText: { fontSize: 22, fontWeight: "900", color: colors.textPrimary, marginBottom: 6, letterSpacing: -0.4 },
    subHeroText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    faqList: { gap: 12 },
    answer: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, paddingTop: 4 },
  });
