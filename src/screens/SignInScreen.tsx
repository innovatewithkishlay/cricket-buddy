import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, TextInput, Snackbar } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type SignInScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SignIn"
>;

export default function SignInScreen() {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleSignIn}
        loading={loading}
        style={styles.button}
      >
        Sign In
      </Button>
      <Button
        onPress={() => navigation.navigate("SignUp")}
        style={styles.button}
      >
        Create Account
      </Button>
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
      >
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  input: { marginBottom: 15 },
  button: { marginTop: 10 },
});
