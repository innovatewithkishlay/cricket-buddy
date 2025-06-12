import React, { useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
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
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="cricket"
          size={56}
          color="#FFD700"
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.title}>Cricket Buddy</Text>
        <Text style={styles.subtitle}>Your Ultimate Cricket Companion</Text>
        <Button
          mode="contained"
          icon="google"
          onPress={() => promptAsync()}
          loading={loading}
          style={styles.googleButton}
          contentStyle={{ height: 48 }}
          labelStyle={{ fontSize: 16, fontWeight: "bold" }}
          disabled={!request || loading}
        >
          Continue with Google
        </Button>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A3D2C", justifyContent: "center" },
  content: { alignItems: "center", padding: 24 },
  title: { color: "#FFD700", fontWeight: "800", fontSize: 32, marginBottom: 8 },
  subtitle: { color: "#A0C8FF", fontSize: 16, marginBottom: 32 },
  googleButton: {
    width: "100%",
    borderRadius: 12,
    marginTop: 24,
    backgroundColor: "#4285F4",
  },
  error: { color: "#FF6B6B", marginTop: 18, textAlign: "center" },
});
