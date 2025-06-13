import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from "react-native";
import { Text, Button, TextInput, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");
    if (!email || !password || (isSignUp && !confirmPassword)) {
      setError("Please fill all fields.");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="flat"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            theme={{
              colors: {
                primary: "#FFD700",
                onSurface: "#FFFFFF",
                onSurfaceVariant: "#A0C8FF",
                background: "rgba(255, 255, 255, 0.08)",
                surface: "rgba(255, 255, 255, 0.08)",
                outline: "rgba(160, 200, 255, 0.5)",
              },
            }}
            textColor="#FFFFFF"
            left={<TextInput.Icon icon="email" color="#A0C8FF" />}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="flat"
            secureTextEntry
            style={[styles.input, styles.inputSpacing]}
            theme={{
              colors: {
                primary: "#FFD700",
                onSurface: "#FFFFFF",
                onSurfaceVariant: "#A0C8FF",
                background: "rgba(255, 255, 255, 0.08)",
                surface: "rgba(255, 255, 255, 0.08)",
                outline: "rgba(160, 200, 255, 0.5)",
              },
            }}
            textColor="#FFFFFF"
            left={<TextInput.Icon icon="lock" color="#A0C8FF" />}
          />
          {isSignUp && (
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="flat"
              secureTextEntry
              style={[styles.input, styles.inputSpacing]}
              theme={{
                colors: {
                  primary: "#FFD700",
                  onSurface: "#FFFFFF",
                  onSurfaceVariant: "#A0C8FF",
                  background: "rgba(255, 255, 255, 0.08)",
                  surface: "rgba(255, 255, 255, 0.08)",
                  outline: "rgba(160, 200, 255, 0.5)",
                },
              }}
              textColor="#FFFFFF"
              left={<TextInput.Icon icon="lock-check" color="#A0C8FF" />}
            />
          )}

          <Button
            mode="contained"
            onPress={handleAuth}
            loading={loading}
            style={styles.authButton}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
            buttonColor="#0A6847"
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading && (
            <ActivityIndicator
              size="large"
              color="#FFD700"
              style={styles.loader}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </Text>
          <Button
            onPress={() => {
              setIsSignUp((prev) => !prev);
              setError("");
              setPassword("");
              setConfirmPassword("");
            }}
            mode="text"
            labelStyle={styles.switchLabel}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Button>
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
    backgroundColor: "rgba(10, 52, 35, 0.92)",
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
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  inputSpacing: {
    marginTop: 8,
  },
  authButton: {
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    color: "#A0C8FF",
    marginRight: 4,
    opacity: 0.9,
    fontSize: 15,
  },
  switchLabel: {
    color: "#FFD700",
    fontWeight: "700",
    fontSize: 15,
    textDecorationLine: "underline",
  },
});
