import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
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
  const pulseAnim = useState(new Animated.Value(1))[0];
  const buttonScale = useState(new Animated.Value(1))[0];

  // Pulsing animation for cricket icon
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, []);

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
    // Button press animation
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

    // Haptic feedback
    Vibration.vibrate(5);

    promptAsync();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}
        >
          <MaterialCommunityIcons
            name="cricket"
            size={64}
            color="#FFD700"
            style={styles.icon}
          />
          <Text style={styles.title}>Cricket Buddy</Text>
          <Text style={styles.subtitle}>Your Ultimate Cricket Companion</Text>
        </Animated.View>

        <View style={styles.card}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Button
              mode="contained"
              icon={() => (
                <MaterialCommunityIcons name="google" size={24} color="white" />
              )}
              onPress={handlePress}
              loading={loading}
              style={styles.googleButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              disabled={!request || loading}
            >
              Continue with Google
            </Button>
          </Animated.View>

          {error && <Text style={styles.error}>{error}</Text>}

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
          <View style={styles.decorationItem} />
          <View style={styles.decorationItem} />
          <View style={styles.decorationItem} />
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
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  icon: {
    marginBottom: 16,
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    color: "#FFD700",
    fontWeight: "800",
    fontSize: 36,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
  subtitle: {
    color: "#A0C8FF",
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(10, 52, 35, 0.8)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  googleButton: {
    borderRadius: 12,
    backgroundColor: "#4285F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  error: {
    color: "#FF6B6B",
    marginTop: 20,
    textAlign: "center",
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 12,
    borderRadius: 8,
  },
  loader: {
    marginTop: 30,
    transform: [{ scale: 1.3 }],
  },
  footer: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(160, 200, 255, 0.2)",
    paddingTop: 16,
  },
  footerText: {
    color: "#A0C8FF",
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
  },
  bottomDecoration: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
    gap: 10,
  },
  decorationItem: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD700",
    opacity: 0.7,
  },
});
