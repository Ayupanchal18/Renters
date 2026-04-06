import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Mail, Phone, MapPin, Clock, Send, ChevronDown } from "lucide-react-native";
import { useTheme } from "../../theme/useTheme";
import AppScreen from "../../components/layout/AppScreen";

export default function ContactScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "general",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const categories = [
    { label: "General Inquiry", value: "general" },
    { label: "Property Issue", value: "property" },
    { label: "Account Help", value: "account" },
    { label: "Technical Support", value: "technical" },
    { label: "Other", value: "other" },
  ];

  const handleUpdate = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
      
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
          category: "general",
          message: "",
        });
        setSubmitted(false);
      }, 3000);
    }, 1500);
  };

  return (
    <AppScreen title="Contact Us" subtitle="Get in Touch" showBack>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          
          {/* Hero text */}
          <Text style={styles.heroText}>
            Have questions about rental properties? Our dedicated support team is ready to help you find the perfect space.
          </Text>

          {/* Contact Info Cards */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
                <Mail size={22} color="#ffffff" />
              </View>
              <Text style={styles.infoTitle}>Email</Text>
              <Text style={styles.infoVal}>support@renters.in</Text>
              <Text style={styles.infoSub}>Responds within 24 hours</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
                <Phone size={22} color="#ffffff" />
              </View>
              <Text style={styles.infoTitle}>Phone</Text>
              <Text style={styles.infoVal}>+91 79 1234 5678</Text>
              <Text style={styles.infoSub}>Mon–Sat 10AM–7PM IST</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.iconWrap, { backgroundColor: colors.error }]}>
                <MapPin size={22} color="#ffffff" />
              </View>
              <Text style={styles.infoTitle}>Address</Text>
              <Text style={styles.infoVal}>CG Road, Navrangpura</Text>
              <Text style={styles.infoSub}>Ahmedabad, Gujarat</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={[styles.iconWrap, { backgroundColor: colors.success }]}>
                <Clock size={22} color="#ffffff" />
              </View>
              <Text style={styles.infoTitle}>Hours</Text>
              <Text style={styles.infoVal}>Mon–Sat: 10AM – 7PM</Text>
              <Text style={styles.infoSub}>Sunday: Closed</Text>
            </View>
          </View>

          {/* Contact Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Send us a Message</Text>
            <Text style={styles.formSubtitle}>
              Fill out the form below and we'll get back to you as soon as possible.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(t) => handleUpdate("name", t)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(t) => handleUpdate("email", t)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(t) => handleUpdate("phone", t)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Inquiry Category *</Text>
              {!isCategoryOpen ? (
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => setIsCategoryOpen(true)}
                >
                  <Text style={styles.selectText}>
                    {categories.find(c => c.value === formData.category)?.label}
                  </Text>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.dropdown}>
                  {categories.map((cat, idx) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.dropdownItem,
                        idx !== categories.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                      ]}
                      onPress={() => {
                        handleUpdate("category", cat.value);
                        setIsCategoryOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownText, formData.category === cat.value && { color: colors.primary, fontWeight: '700' }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us how we can help..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.message}
                onChangeText={(t) => handleUpdate("message", t)}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.submitBtn, 
                submitted && { backgroundColor: colors.success }
              ]} 
              onPress={handleSubmit}
              disabled={submitting || submitted}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : submitted ? (
                <>
                  <Text style={styles.submitText}>Message Sent!</Text>
                </>
              ) : (
                <>
                  <Send size={18} color="#fff" />
                  <Text style={styles.submitText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 32,
  },
  infoCard: {
    width: "48%",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoVal: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.7,
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
    zIndex: 1, // needed for custom dropdown overlay trick if used, but we use inline so fine
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  selectBtn: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
