import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { auth, db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function NewMatchScreen({ navigation }) {
  const [matchTitle, setMatchTitle] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");

  const handleCreateMatch = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "matches"), {
      matchTitle,
      teamA,
      teamB,
      createdAt: serverTimestamp(),
    });
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>
        Start New Match
      </Text>
      <TextInput
        label="Match Title"
        value={matchTitle}
        onChangeText={setMatchTitle}
        style={styles.input}
      />
      <TextInput
        label="Team A Name"
        value={teamA}
        onChangeText={setTeamA}
        style={styles.input}
      />
      <TextInput
        label="Team B Name"
        value={teamB}
        onChangeText={setTeamB}
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleCreateMatch}
        style={{ marginTop: 24 }}
      >
        Save Match
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  input: { marginBottom: 16 },
});
