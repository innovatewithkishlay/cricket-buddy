import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Vibration,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Text, Button, ActivityIndicator, Checkbox } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/firebase";
import * as Google from "expo-auth-session/providers/google";
import {
  ANDROID_CLIENT_ID,
  EXPO_CLIENT_ID,
  IOS_CLIENT_ID,
} from "../firebase/googleConfig";

export default function AuthScreen() {
  const clientId = Platform.select({
    android: ANDROID_CLIENT_ID,
    ios: IOS_CLIENT_ID,
    default: EXPO_CLIENT_ID,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({ clientId });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const buttonScale = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [response]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    Vibration.vibrate(5);
    promptAsync();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons
            name="cricket"
            size={80}
            color="#FFD700"
            style={styles.icon}
          />
          <Text style={styles.title}>Cricket Buddy</Text>
          <Text style={styles.subtitle}>Your Ultimate Cricket Companion</Text>
        </View>

        <View style={styles.card}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Button
              mode="contained"
              onPress={handlePress}
              loading={loading}
              disabled={!request || loading || !agreed}
              style={[
                styles.googleButton,
                (!agreed || loading) && styles.googleButtonDisabled,
              ]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              uppercase={false}
              icon={() => (
                <MaterialCommunityIcons
                  name="google"
                  size={24}
                  color="#fff"
                  style={{ marginRight: 12 }}
                />
              )}
            >
              Continue with Google
            </Button>
          </Animated.View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading && (
            <ActivityIndicator
              size="large"
              color="#FFD700"
              style={styles.loader}
            />
          )}

          <View style={styles.agreeRow}>
            <Checkbox
              status={agreed ? "checked" : "unchecked"}
              onPress={() => setAgreed((prev) => !prev)}
              color="#FFD700"
              uncheckedColor="#A0C8FF"
            />
            <Text style={styles.agreeText}>
              I agree to the Terms and{" "}
              <Text
                style={styles.privacyLink}
                onPress={() => setPrivacyVisible(true)}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </View>

      <Modal
        animationType="slide"
        visible={privacyVisible}
        transparent
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <Text style={styles.modalBody}>
                {`Effective Date: June 12, 2025

At Cricket Buddy, your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use our cricket notes application (“the App”). By using Cricket Buddy, you agree to the practices described below.

1. Information We Collect

a. Personal Information
- When you sign in using Google, we collect your name, email address, and Google profile picture to create and manage your account.
- We do not collect your password or sensitive authentication data.

b. Usage Data
- We collect information about how you use the App, such as the features you access, notes you create, and your interactions with cricket content.
- We may collect device information (such as device type, operating system, and app version) for analytics and troubleshooting.

2. How We Use Your Information

- To provide, maintain, and improve the App’s features and your user experience.
- To authenticate your identity and secure your account using Google OAuth and Firebase Authentication.
- To personalize your experience, such as saving your cricket notes and preferences.
- To communicate important updates, service information, or respond to your support requests.

3. Data Sharing and Disclosure

- We do not sell or rent your personal data to third parties.
- Your data may be shared with trusted service providers (such as Firebase) only to the extent necessary for app functionality and security.
- We may disclose information if required by law or to protect the rights, property, or safety of Cricket Buddy, its users, or others.

4. Data Security

- We use industry-standard security measures, including encryption and secure authentication, to protect your information.
- Access to your data is restricted to authorized personnel only.

5. Data Retention

- Your notes and personal data are retained as long as your account is active or as needed to provide you with the App’s services.
- You may delete your notes or request account deletion at any time via the app or by contacting support.

6. Your Rights

- You can access, update, or delete your personal information at any time through the App.
- You may withdraw your consent for data processing by deleting your account.

7. Children’s Privacy

- Cricket Buddy is not intended for children under 13. We do not knowingly collect personal information from children under 13.

8. Changes to This Policy

- We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy in the App.

9. Contact Us

If you have any questions or concerns about this Privacy Policy or your data, please contact us at:
Email: support@cricketbuddy.app

By using Cricket Buddy, you acknowledge that you have read and understood this Privacy Policy.
`}
              </Text>
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setPrivacyVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A3D2C",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  icon: {
    marginBottom: 16,
    textShadowColor: "rgba(255, 215, 0, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    color: "#FFD700",
    fontWeight: "900",
    fontSize: 36,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#A0C8FF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "rgba(10, 52, 35, 0.9)",
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  googleButtonDisabled: {
    backgroundColor: "#A0C8FF",
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabel: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  error: {
    color: "#FF6B6B",
    marginTop: 20,
    textAlign: "center",
    fontWeight: "600",
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  loader: {
    marginTop: 30,
    alignSelf: "center",
  },
  agreeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: -8,
  },
  agreeText: {
    color: "#A0C8FF",
    fontSize: 14,
    marginLeft: 0,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  privacyLink: {
    color: "#FFD700",
    textDecorationLine: "underline",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#0A3D2C",
    textAlign: "center",
  },
  modalBody: {
    fontSize: 15,
    color: "#333",
    marginBottom: 20,
    textAlign: "left",
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    color: "#0A3D2C",
    fontWeight: "bold",
    fontSize: 16,
  },
});
