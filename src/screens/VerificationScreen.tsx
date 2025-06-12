import React, { useEffect, useState } from "react";
import { View, StyleSheet, Button, Text } from "react-native";
import { auth } from "../firebase/firebase";
import { sendEmailVerification } from "firebase/auth";

export default function VerificationScreen({ route }) {
  const [resendDisabled, setResendDisabled] = useState(false);
  const email = route.params?.email || "";

  const handleResendVerification = async () => {
    setResendDisabled(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setTimeout(() => setResendDisabled(false), 30000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.text}>
        A verification link has been sent to {email}. Please check your inbox
        and verify your email to continue.
      </Text>
      <Button
        title="Resend Verification Email"
        onPress={handleResendVerification}
        disabled={resendDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  text: { fontSize: 16, marginBottom: 24 },
});
