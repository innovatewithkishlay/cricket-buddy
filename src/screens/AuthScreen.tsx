import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
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
  signInWithPhoneNumber,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import * as Google from "expo-auth-session/providers/google";
import {
  ANDROID_CLIENT_ID,
  EXPO_CLIENT_ID,
  IOS_CLIENT_ID,
} from "../firebase/googleConfig";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { LinearGradient } from "expo-linear-gradient";

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, "Auth">;
type Props = {
  navigation: AuthScreenNavigationProp;
};

export default function AuthScreen({ navigation }: Props) {
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
  const [pulseAnim] = useState(new Animated.Value(1));

  const clientId =
    Platform.OS === "android"
      ? ANDROID_CLIENT_ID
      : Platform.OS === "ios"
      ? IOS_CLIENT_ID
      : EXPO_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
  });

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

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
    } catch (error: any) {
      setError(error?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setError(error?.message || "Email sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const confirmation = await signInWithPhoneNumber(auth, phone);
      setConfirmResult(confirmation);
    } catch (error: any) {
      setError(error?.message || "OTP sending failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await confirmResult.confirm(otp);
    } catch (error: any) {
      setError(error?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/cricket-bg.jpg")}
      style={styles.container}
      blurRadius={2}
    >
      <LinearGradient
        colors={["rgba(0, 30, 60, 0.85)", "rgba(0, 60, 90, 0.9)"]}
        style={styles.gradientOverlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <MaterialCommunityIcons
                name="cricket"
                size={48}
                color="#FFD700"
                style={styles.logoIcon}
              />
              <Text variant="headlineMedium" style={styles.title}>
                Cricket Buddy
              </Text>
              <Text style={styles.subtitle}>
                Your Ultimate Cricket Companion
              </Text>
            </Animated.View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "email" ? styles.activeTab : styles.inactiveTab,
                ]}
                onPress={() => setActiveTab("email")}
              >
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color={activeTab === "email" ? "#FFF" : "#A0C8FF"}
                />
                <Text
                  style={
                    activeTab === "email"
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }
                >
                  Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "google"
                    ? styles.activeTab
                    : styles.inactiveTab,
                ]}
                onPress={() => setActiveTab("google")}
              >
                <MaterialCommunityIcons
                  name="google"
                  size={20}
                  color={activeTab === "google" ? "#FFF" : "#A0C8FF"}
                />
                <Text
                  style={
                    activeTab === "google"
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }
                >
                  Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "phone" ? styles.activeTab : styles.inactiveTab,
                ]}
                onPress={() => setActiveTab("phone")}
              >
                <MaterialCommunityIcons
                  name="cellphone"
                  size={20}
                  color={activeTab === "phone" ? "#FFF" : "#A0C8FF"}
                />
                <Text
                  style={
                    activeTab === "phone"
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }
                >
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {activeTab === "email" && (
                <View style={styles.form}>
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
                        background: "rgba(255, 255, 255, 0.1)",
                        placeholder: "#A0C8FF",
                        text: "#FFFFFF",
                      },
                    }}
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
                        background: "rgba(255, 255, 255, 0.1)",
                        placeholder: "#A0C8FF",
                        text: "#FFFFFF",
                      },
                    }}
                    left={<TextInput.Icon icon="lock" color="#A0C8FF" />}
                  />
                  <Button
                    mode="contained"
                    onPress={handleEmailSignIn}
                    loading={loading}
                    style={styles.authButton}
                    labelStyle={styles.buttonLabel}
                    contentStyle={styles.buttonContent}
                    theme={{ colors: { primary: "#FFD700" } }}
                  >
                    Sign In
                  </Button>
                </View>
              )}

              {activeTab === "google" && (
                <Button
                  mode="contained"
                  icon={({ color, size }) => (
                    <MaterialCommunityIcons
                      name="google"
                      color={color}
                      size={size}
                    />
                  )}
                  onPress={() => promptAsync()}
                  loading={loading}
                  style={[styles.authButton, styles.googleButton]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  disabled={!request}
                  theme={{ colors: { primary: "#4285F4" } }}
                >
                  Continue with Google
                </Button>
              )}

              {activeTab === "phone" && (
                <View style={styles.form}>
                  {!confirmResult ? (
                    <>
                      <TextInput
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        mode="flat"
                        keyboardType="phone-pad"
                        placeholder="+91 12345 67890"
                        style={styles.input}
                        theme={{
                          colors: {
                            primary: "#FFD700",
                            background: "rgba(255, 255, 255, 0.1)",
                            placeholder: "#A0C8FF",
                            text: "#FFFFFF",
                          },
                        }}
                        left={
                          <TextInput.Icon icon="cellphone" color="#A0C8FF" />
                        }
                      />
                      <Button
                        mode="contained"
                        onPress={handleSendOtp}
                        loading={loading}
                        style={styles.authButton}
                        labelStyle={styles.buttonLabel}
                        contentStyle={styles.buttonContent}
                        theme={{ colors: { primary: "#FFD700" } }}
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
                        mode="flat"
                        keyboardType="number-pad"
                        style={styles.input}
                        theme={{
                          colors: {
                            primary: "#FFD700",
                            background: "rgba(255, 255, 255, 0.1)",
                            placeholder: "#A0C8FF",
                            text: "#FFFFFF",
                          },
                        }}
                        left={<TextInput.Icon icon="numeric" color="#A0C8FF" />}
                      />
                      <Button
                        mode="contained"
                        onPress={handleVerifyOtp}
                        loading={loading}
                        style={styles.authButton}
                        labelStyle={styles.buttonLabel}
                        contentStyle={styles.buttonContent}
                        theme={{ colors: { primary: "#FFD700" } }}
                      >
                        Verify OTP
                      </Button>
                    </>
                  )}
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Cricket Buddy?</Text>
              <TouchableOpacity>
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <Snackbar
              visible={!!error}
              onDismiss={() => setError("")}
              duration={3000}
              style={styles.snackbar}
              theme={{ colors: { surface: "#FF6B6B", accent: "#FFF" } }}
            >
              {error}
            </Snackbar>

            {loading && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator
                  size="large"
                  color="#FFD700"
                  style={styles.loader}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoIcon: {
    marginBottom: 16,
  },
  title: {
    color: "#FFD700",
    fontWeight: "800",
    fontSize: 32,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    color: "#A0C8FF",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    backgroundColor: "rgba(0, 50, 100, 0.5)",
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#0066CC",
    shadowColor: "#00B0FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  activeTabText: {
    color: "#FFF",
    fontWeight: "700",
    marginLeft: 8,
  },
  inactiveTabText: {
    color: "#A0C8FF",
    fontWeight: "600",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "rgba(0, 40, 80, 0.6)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(100, 200, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  inputSpacing: {
    marginTop: 8,
  },
  authButton: {
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  googleButton: {
    backgroundColor: "#4285F4",
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#A0C8FF",
    marginRight: 4,
  },
  signupText: {
    color: "#FFD700",
    fontWeight: "700",
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
  },
  loader: {
    transform: [{ scale: 1.5 }],
  },
  snackbar: {
    borderRadius: 12,
    marginBottom: 20,
  },
});
