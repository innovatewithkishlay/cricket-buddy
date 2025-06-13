import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const ballAnim = useRef(new Animated.Value(0)).current;

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
    animateBall();
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

  const animateBall = () => {
    ballAnim.setValue(0);
    Animated.loop(
      Animated.timing(ballAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();
  };

  const ballSpin = ballAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons
            name="cricket"
            size={70}
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
                background: "rgba(255,255,255,0.08)",
                surface: "rgba(255,255,255,0.08)",
                outline: "rgba(160,200,255,0.5)",
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
            secureTextEntry={!showPassword}
            style={[styles.input, styles.inputSpacing]}
            theme={{
              colors: {
                primary: "#FFD700",
                onSurface: "#FFFFFF",
                onSurfaceVariant: "#A0C8FF",
                background: "rgba(255,255,255,0.08)",
                surface: "rgba(255,255,255,0.08)",
                outline: "rgba(160,200,255,0.5)",
              },
            }}
            textColor="#FFFFFF"
            left={<TextInput.Icon icon="lock" color="#A0C8FF" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                color="#A0C8FF"
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {isSignUp && (
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="flat"
              secureTextEntry={!showConfirmPassword}
              style={[styles.input, styles.inputSpacing]}
              theme={{
                colors: {
                  primary: "#FFD700",
                  onSurface: "#FFFFFF",
                  onSurfaceVariant: "#A0C8FF",
                  background: "rgba(255,255,255,0.08)",
                  surface: "rgba(255,255,255,0.08)",
                  outline: "rgba(160,200,255,0.5)",
                },
              }}
              textColor="#FFFFFF"
              left={<TextInput.Icon icon="lock-check" color="#A0C8FF" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  color="#A0C8FF"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
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
            disabled={loading}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsSignUp((prev) => !prev);
              setError("");
              setPassword("");
              setConfirmPassword("");
            }}
          >
            <Text style={styles.switchLabel}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loaderOverlay}>
          <BlurView intensity={60} style={styles.blurView}>
            <Animated.View style={{ transform: [{ rotate: ballSpin }] }}>
              <MaterialCommunityIcons
                name="cricket"
                size={64}
                color="#FFD700"
              />
            </Animated.View>
          </BlurView>
        </View>
      )}
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
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  blurView: {
    width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
