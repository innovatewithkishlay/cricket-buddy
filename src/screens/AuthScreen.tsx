import React, { useState, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import {
  Text,
  Button,
  TextInput,
  Snackbar,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  signInWithEmailAndPassword,
  signInWithCredential,
  PhoneAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import * as Google from "expo-auth-session/providers/google";
import {
  ANDROID_CLIENT_ID,
  EXPO_CLIENT_ID,
  IOS_CLIENT_ID,
} from "../firebase/googleConfig";

export default function AuthScreen({ navigation }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<"email" | "google" | "phone">(
    "email"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    expoClientId: EXPO_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      handleFirebaseAuth(credential);
    }
  }, [response]);

  const handleFirebaseAuth = async (credential: any) => {
    setLoading(true);
    try {
      await signInWithCredential(auth, credential);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Sign In
  const handleEmailSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Phone Auth
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const confirmation = await signInWithPhoneNumber(auth, phone);
      setConfirmResult(confirmation);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await confirmResult.confirm(otp);
    } catch (error) {
      setError(error.message);
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
        <Text variant="headlineMedium" style={styles.title}>
          Welcome to Cricket Buddy
        </Text>

        {/* Auth Method Tabs */}
        <View style={styles.tabContainer}>
          <Button
            mode={activeTab === "email" ? "contained" : "outlined"}
            onPress={() => setActiveTab("email")}
            style={styles.tabButton}
          >
            Email
          </Button>
          <Button
            mode={activeTab === "google" ? "contained" : "outlined"}
            onPress={() => setActiveTab("google")}
            style={styles.tabButton}
            icon="google"
          >
            Google
          </Button>
          <Button
            mode={activeTab === "phone" ? "contained" : "outlined"}
            onPress={() => setActiveTab("phone")}
            style={styles.tabButton}
            icon="cellphone"
          >
            Phone
          </Button>
        </View>

        {/* Email/PASSWORD FORM */}
        {activeTab === "email" && (
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.inputSpacing}
            />
            <Button
              mode="contained"
              onPress={handleEmailSignIn}
              loading={loading}
              style={styles.authButton}
            >
              Sign In
            </Button>
          </View>
        )}

        {/* GOOGLE AUTH */}
        {activeTab === "google" && (
          <Button
            mode="contained"
            icon="google"
            onPress={() => promptAsync()}
            loading={loading}
            style={styles.authButton}
            contentStyle={styles.googleButtonContent}
            labelStyle={styles.googleButtonLabel}
          >
            Continue with Google
          </Button>
        )}

        {/* PHONE AUTH */}
        {activeTab === "phone" && (
          <View style={styles.form}>
            {!confirmResult ? (
              <>
                <TextInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  placeholder="+91 12345 67890"
                />
                <Button
                  mode="contained"
                  onPress={handleSendOtp}
                  loading={loading}
                  style={styles.authButton}
                >
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <TextInput
                  label="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  mode="outlined"
                  keyboardType="number-pad"
                />
                <Button
                  mode="contained"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  style={styles.authButton}
                >
                  Verify OTP
                </Button>
              </>
            )}
          </View>
        )}

        {/* Error Handling */}
        <Snackbar
          visible={!!error}
          onDismiss={() => setError("")}
          duration={3000}
          style={{ backgroundColor: theme.colors.error }}
        >
          {error}
        </Snackbar>

        {loading && <ActivityIndicator style={styles.loader} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "700",
    color: "#1976d2",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
  },
  form: {
    gap: 16,
  },
  inputSpacing: {
    marginTop: 12,
  },
  authButton: {
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 8,
  },
  googleButtonContent: {
    flexDirection: "row-reverse",
    height: 48,
  },
  googleButtonLabel: {
    fontSize: 16,
  },
  loader: {
    marginTop: 24,
  },
});
