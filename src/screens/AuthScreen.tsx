import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
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
  const tabAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const clientId =
    Platform.OS === "android"
      ? ANDROID_CLIENT_ID
      : Platform.OS === "ios"
      ? IOS_CLIENT_ID
      : EXPO_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
  });

  // Animation effects
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
    // Animate tab indicator
    const tabIndex = activeTab === "email" ? 0 : activeTab === "google" ? 1 : 2;
    Animated.spring(tabAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      handleFirebaseAuth(credential);
    }
  }, [response]);

  const handlePress = (action: () => void) => {
    // Provide haptic feedback
    Vibration.vibrate(5);

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

    action();
  };

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

  // Calculate animated position for tab indicator
  const tabIndicatorPosition = tabAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 120, 240], // Adjust based on your tab width
  });

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
            size={48}
            color="#FFD700"
            style={styles.logoIcon}
          />
          <Text variant="headlineMedium" style={styles.title}>
            Cricket Buddy
          </Text>
          <Text style={styles.subtitle}>Your Ultimate Cricket Companion</Text>
        </Animated.View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => {
              Vibration.vibrate(5);
              setActiveTab("email");
            }}
          >
            <MaterialCommunityIcons
              name="email"
              size={20}
              color={activeTab === "email" ? "#FFD700" : "#A0C8FF"}
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
            style={styles.tabButton}
            onPress={() => {
              Vibration.vibrate(5);
              setActiveTab("google");
            }}
          >
            <MaterialCommunityIcons
              name="google"
              size={20}
              color={activeTab === "google" ? "#FFD700" : "#A0C8FF"}
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
            style={styles.tabButton}
            onPress={() => {
              Vibration.vibrate(5);
              setActiveTab("phone");
            }}
          >
            <MaterialCommunityIcons
              name="cellphone"
              size={20}
              color={activeTab === "phone" ? "#FFD700" : "#A0C8FF"}
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

          <Animated.View
            style={[
              styles.tabIndicator,
              { transform: [{ translateX: tabIndicatorPosition }] },
            ]}
          />
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
                    background: "rgba(255, 255, 255, 0.05)",
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
                    background: "rgba(255, 255, 255, 0.05)",
                    placeholder: "#A0C8FF",
                    text: "#FFFFFF",
                  },
                }}
                left={<TextInput.Icon icon="lock" color="#A0C8FF" />}
              />
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <Button
                  mode="contained"
                  onPress={() => handlePress(handleEmailSignIn)}
                  loading={loading}
                  style={styles.authButton}
                  labelStyle={styles.buttonLabel}
                  contentStyle={styles.buttonContent}
                  theme={{ colors: { primary: "#0A6847" } }}
                >
                  Sign In
                </Button>
              </Animated.View>
            </View>
          )}

          {activeTab === "google" && (
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Button
                mode="contained"
                icon={({ color, size }) => (
                  <MaterialCommunityIcons
                    name="google"
                    color={color}
                    size={size}
                  />
                )}
                onPress={() => handlePress(() => promptAsync())}
                loading={loading}
                style={[styles.authButton, styles.googleButton]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                disabled={!request}
                theme={{ colors: { primary: "#4285F4" } }}
              >
                Continue with Google
              </Button>
            </Animated.View>
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
                        background: "rgba(255, 255, 255, 0.05)",
                        placeholder: "#A0C8FF",
                        text: "#FFFFFF",
                      },
                    }}
                    left={<TextInput.Icon icon="cellphone" color="#A0C8FF" />}
                  />
                  <Animated.View
                    style={{ transform: [{ scale: buttonScale }] }}
                  >
                    <Button
                      mode="contained"
                      onPress={() => handlePress(handleSendOtp)}
                      loading={loading}
                      style={styles.authButton}
                      labelStyle={styles.buttonLabel}
                      contentStyle={styles.buttonContent}
                      theme={{ colors: { primary: "#0A6847" } }}
                    >
                      Send OTP
                    </Button>
                  </Animated.View>
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
                        background: "rgba(255, 255, 255, 0.05)",
                        placeholder: "#A0C8FF",
                        text: "#FFFFFF",
                      },
                    }}
                    left={<TextInput.Icon icon="numeric" color="#A0C8FF" />}
                  />
                  <Animated.View
                    style={{ transform: [{ scale: buttonScale }] }}
                  >
                    <Button
                      mode="contained"
                      onPress={() => handlePress(handleVerifyOtp)}
                      loading={loading}
                      style={styles.authButton}
                      labelStyle={styles.buttonLabel}
                      contentStyle={styles.buttonContent}
                      theme={{ colors: { primary: "#0A6847" } }}
                    >
                      Verify OTP
                    </Button>
                  </Animated.View>
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Cricket Buddy?</Text>
          <TouchableOpacity onPress={() => Vibration.vibrate(5)}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A3D2C",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoIcon: {
    marginBottom: 16,
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    color: "#FFD700",
    fontWeight: "800",
    fontSize: 32,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: "#A0C8FF",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "500",
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    backgroundColor: "rgba(10, 52, 35, 0.7)",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(100, 200, 180, 0.2)",
    position: "relative",
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    zIndex: 2,
  },
  tabIndicator: {
    position: "absolute",
    height: "100%",
    width: "33.3%",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderRadius: 10,
    top: 0,
    left: 0,
    zIndex: 1,
  },
  activeTabText: {
    color: "#FFD700",
    fontWeight: "700",
    marginLeft: 8,
  },
  inactiveTabText: {
    color: "#A0C8FF",
    fontWeight: "600",
    marginLeft: 8,
    opacity: 0.8,
  },
  card: {
    backgroundColor: "rgba(10, 40, 30, 0.6)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(100, 200, 180, 0.2)",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
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
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#A0C8FF",
    marginRight: 4,
    opacity: 0.9,
  },
  signupText: {
    color: "#FFD700",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    zIndex: 10,
  },
  loader: {
    transform: [{ scale: 1.5 }],
  },
  snackbar: {
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#FF6B6B",
  },
});
