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
              disabled={!request || loading}
              style={styles.googleButton}
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

          <Text style={styles.footerText}>
            By continuing, you agree to our Terms and Privacy Policy
          </Text>
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
  footerText: {
    marginTop: 28,
    color: "#A0C8FF",
    fontSize: 13,
    textAlign: "center",
    opacity: 0.8,
    fontWeight: "500",
  },
});
