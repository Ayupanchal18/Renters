import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/tokens';
import CollapsibleSection from '../../components/ui/CollapsibleSection';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>FAQs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heroText}>Frequently Asked Questions</Text>
        <Text style={styles.subHeroText}>Everything you need to know about how Renters works.</Text>

        <View style={styles.faqList}>
          {FAQ_DATA.map((faq) => (
            <CollapsibleSection key={faq.k} title={faq.question} defaultOpen={false}>
              <Text style={styles.answer}>{faq.answer}</Text>
            </CollapsibleSection>
          ))}
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
  content: { padding: 20, paddingBottom: 40 },
  heroText: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  subHeroText: { fontSize: 16, color: colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  faqList: { gap: 12 },
  answer: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, paddingTop: 4 },
});
