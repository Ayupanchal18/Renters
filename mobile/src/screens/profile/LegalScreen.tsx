import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import AppScreen from "../../components/layout/AppScreen";
import { colors } from "../../theme/tokens";

export default function LegalScreen() {
  return (
    <AppScreen title="Legal & Privacy" subtitle="Terms and conditions" showBack>
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.text}>
            Welcome to Renters. These terms of service govern your use of the application and platform. 
            By accessing or using Renters, you agree to be bound by these terms.
            {"\n\n"}
            We reserve the right to modify these terms at any time. Your continued use of the platform constitutes 
            your acceptance of any such modifications.
          </Text>

          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.text}>
            Your privacy is important to us. This privacy policy explains how we collect, use, and protect 
            your personal information when you use our services.
            {"\n\n"}
            We only collect the data necessary to provide our services and do not share your personal 
            information with third parties without your consent.
          </Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 24,
  },
  text: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
