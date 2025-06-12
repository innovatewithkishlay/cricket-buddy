import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Vibration,
} from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
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
            size={72}
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
              icon="google"
              onPress={handlePress}
              loading={loading}
              style={styles.googleButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              disabled={!request || loading}
              uppercase={false}
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
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms and Privacy Policy
            </Text>
          </View>
        </View>
        <View style={styles.bottomDecoration}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.decorationItem} />
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A3D2C",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  icon: {
    marginBottom: 20,
    textShadowColor: "rgba(255, 215, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  title: {
    color: "#FFD700",
    fontWeight: "900",
    fontSize: 40,
    letterSpacing: 1.2,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  subtitle: {
    color: "#A0C8FF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 320,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(10, 52, 35, 0.85)",
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  googleButton: {
    borderRadius: 14,
    backgroundColor: "#4285F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    height: 56,
    flexDirection: "row-reverse",
    justifyContent: "center",
    gap: 12,
  },
  buttonLabel: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.7,
  },
  error: {
    color: "#FF6B6B",
    marginTop: 24,
    textAlign: "center",
    fontWeight: "700",
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    fontSize: 14,
  },
  loader: {
    marginTop: 36,
    transform: [{ scale: 1.4 }],
  },
  footer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "rgba(160, 200, 255, 0.25)",
    paddingTop: 18,
  },
  footerText: {
    color: "#A0C8FF",
    fontSize: 13,
    textAlign: "center",
    opacity: 0.85,
    fontWeight: "500",
  },
  bottomDecoration: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 48,
    gap: 14,
  },
  decorationItem: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFD700",
    opacity: 0.8,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});
