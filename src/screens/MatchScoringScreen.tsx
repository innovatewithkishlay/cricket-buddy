import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Button, Card, TextInput, Divider } from "react-native-paper";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { db, auth } from "../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

type MatchScoringScreenRouteProp = RouteProp<
  RootStackParamList,
  "MatchScoring"
>;
type Props = { route: MatchScoringScreenRouteProp };

export default function MatchScoringScreen({ route }: Props) {
  const { matchId } = route.params;
  const [match, setMatch] = useState<any>(null);
  const [currentOver, setCurrentOver] = useState(1);
  const [currentBall, setCurrentBall] = useState(1);
  const [runs, setRuns] = useState("");
  const [wicket, setWicket] = useState(false);
  const [extras, setExtras] = useState("");
  const [scoreLog, setScoreLog] = useState<any[]>([]);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!auth.currentUser) return;
      const matchRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "matches",
        matchId
      );
      const matchSnap = await getDoc(matchRef);
      if (matchSnap.exists()) setMatch(matchSnap.data());
    };
    fetchMatch();
  }, [matchId]);

  const handleAddBall = async () => {
    if (!auth.currentUser) return;
    const ballData = {
      over: currentOver,
      ball: currentBall,
      runs: Number(runs) || 0,
      wicket,
      extras: extras.trim(),
      timestamp: new Date().toISOString(),
    };
    setScoreLog([...scoreLog, ballData]);
    // Optionally, update Firestore with each ball
    const matchRef = doc(db, "users", auth.currentUser.uid, "matches", matchId);
    await updateDoc(matchRef, {
      scoreLog: arrayUnion(ballData),
    });
    // Reset for next ball
    setRuns("");
    setWicket(false);
    setExtras("");
    if (currentBall === 6) {
      setCurrentOver(currentOver + 1);
      setCurrentBall(1);
    } else {
      setCurrentBall(currentBall + 1);
    }
  };

  if (!match) {
    return (
      <View style={styles.centered}>
        <Text>Loading match details...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={match.matchTitle}
          subtitle={`${match.teamA} vs ${match.teamB}`}
        />
        <Card.Content>
          <Text>Date: {new Date(match.date).toLocaleDateString()}</Text>
          <Text>Location: {match.location}</Text>
          <Text>Overs: {match.overs}</Text>
        </Card.Content>
      </Card>

      <Divider style={{ marginVertical: 20 }} />

      <Text variant="titleMedium" style={{ marginBottom: 10 }}>
        Over {currentOver}, Ball {currentBall}
      </Text>
      <TextInput
        label="Runs"
        value={runs}
        onChangeText={setRuns}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Extras (e.g. wd, nb, lb)"
        value={extras}
        onChangeText={setExtras}
        style={styles.input}
      />
      <Button
        mode={wicket ? "contained" : "outlined"}
        style={styles.wicketButton}
        onPress={() => setWicket(!wicket)}
      >
        {wicket ? "Wicket!" : "No Wicket"}
      </Button>
      <Button mode="contained" onPress={handleAddBall} style={styles.addButton}>
        Add Ball
      </Button>

      <Divider style={{ marginVertical: 20 }} />

      <Text variant="titleMedium" style={{ marginBottom: 10 }}>
        Ball-by-Ball Log
      </Text>
      {scoreLog.map((entry, idx) => (
        <View key={idx} style={styles.logRow}>
          <Text>
            Over {entry.over}.{entry.ball}: {entry.runs} run(s)
            {entry.wicket ? " (Wicket)" : ""}
            {entry.extras ? ` [${entry.extras}]` : ""}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  wicketButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  addButton: {
    marginBottom: 24,
    borderRadius: 8,
  },
  logRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
