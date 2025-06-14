import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  Text,
  Button,
  Card,
  TextInput,
  Divider,
  useTheme,
  Menu,
} from "react-native-paper";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { db, auth } from "../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type MatchScoringScreenRouteProp = RouteProp<
  RootStackParamList,
  "MatchScoring"
>;
type Props = { route: MatchScoringScreenRouteProp };

interface Ball {
  over: number;
  ball: number;
  runs: number;
  batsman: string;
  bowler: string;
  isWicket: boolean;
  wicketType?: string;
  extras?: string[];
  timestamp: string;
}

export default function MatchScoringScreen({ route }: Props) {
  const theme = useTheme();
  const { matchId } = route.params;
  const [match, setMatch] = useState<any>(null);
  const [score, setScore] = useState({
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
  });
  const [currentBall, setCurrentBall] = useState({
    runs: 0,
    extras: [] as string[],
  });
  const [showWicketMenu, setShowWicketMenu] = useState(false);
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [currentBowler, setCurrentBowler] = useState("");
  const [scoreLog, setScoreLog] = useState<Ball[]>([]);

  useEffect(() => {
    const loadMatch = async () => {
      if (!auth.currentUser) return;
      const matchRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "matches",
        matchId
      );
      const matchSnap = await getDoc(matchRef);
      if (matchSnap.exists()) {
        const data = matchSnap.data();
        setMatch(data);
        setStriker(data.playersA[0]?.name || "");
        setNonStriker(data.playersA[1]?.name || "");
        setCurrentBowler(data.playersB[0]?.name || "");
      }
    };
    loadMatch();
  }, [matchId]);

  const handleRuns = (runs: number) => {
    setCurrentBall((prev) => ({ ...prev, runs }));
    if (runs === 4 || runs === 6) {
      setTimeout(() => setCurrentBall((prev) => ({ ...prev, runs })), 200);
    }
  };

  const addExtra = (extra: string) => {
    setCurrentBall((prev) => ({
      ...prev,
      extras: [...new Set([...prev.extras, extra])],
    }));
  };

  const recordWicket = (type: string) => {
    setShowWicketMenu(false);
    setCurrentBall((prev) => ({ ...prev, isWicket: true, wicketType: type }));
  };

  const addBall = async () => {
    if (!auth.currentUser || !match) return;

    const newBall: Ball = {
      over: Math.floor(score.balls / 6) + 1,
      ball: (score.balls % 6) + 1,
      runs: currentBall.runs,
      batsman: striker,
      bowler: currentBowler,
      isWicket: currentBall.isWicket,
      wicketType: currentBall.wicketType,
      extras: currentBall.extras,
      timestamp: new Date().toISOString(),
    };

    setScore((prev) => ({
      runs: prev.runs + newBall.runs + (newBall.extras?.includes("wd") ? 1 : 0),
      wickets: prev.wickets + (newBall.isWicket ? 1 : 0),
      overs: Math.floor((prev.balls + 1) / 6),
      balls: prev.balls + 1,
    }));

    if (newBall.runs % 2 !== 0) {
      [striker, nonStriker] = [nonStriker, striker];
    }

    if (newBall.isWicket) {
      const nextBatsman = match.playersA.find(
        (p: any) => p.name !== striker && p.name !== nonStriker
      )?.name;
      if (nextBatsman) setStriker(nextBatsman);
    }

    const matchRef = doc(db, "users", auth.currentUser.uid, "matches", matchId);
    await updateDoc(matchRef, {
      scoreLog: arrayUnion(newBall),
      currentScore: score.runs + newBall.runs,
      currentWickets: score.wickets + (newBall.isWicket ? 1 : 0),
      currentOvers: score.overs + (newBall.ball === 6 ? 1 : 0),
    });

    setCurrentBall({ runs: 0, extras: [] });
  };

  if (!match) {
    return (
      <View style={styles.centered}>
        <Text>Loading match...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.scorecard}>
        <Card.Content>
          <View style={styles.scoreRow}>
            <Text variant="titleLarge" style={styles.teamName}>
              {match.teamA}
            </Text>
            <Text variant="headlineMedium">
              {score.runs}/{score.wickets}
            </Text>
            <Text variant="titleLarge" style={styles.overs}>
              ({score.overs}.{score.balls % 6} ov)
            </Text>
          </View>
          <View style={styles.partnership}>
            <Text>
              Partnership: {striker} & {nonStriker}
            </Text>
            <Text>
              Run Rate:{" "}
              {(score.runs / (score.overs + score.balls / 6)).toFixed(1)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.playersContainer}>
        <Card style={styles.playerCard}>
          <Card.Title
            title="Bowler"
            left={() => <Icon name="bowl" size={24} />}
          />
          <Card.Content>
            <Text variant="titleMedium">{currentBowler}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.playerCard}>
          <Card.Title
            title="Batsmen"
            left={() => <Icon name="cricket" size={24} />}
          />
          <Card.Content>
            <View style={styles.batsmen}>
              <Text style={styles.striker}>✳️ {striker}</Text>
              <Text>{nonStriker}</Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.overCard}>
        <Card.Title
          title="Current Over"
          left={() => <Icon name="progress-clock" size={24} />}
        />
        <Card.Content>
          <View style={styles.overBalls}>
            {[...Array(6)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.ballMarker,
                  i < score.balls % 6 && styles.ballCompleted,
                  scoreLog[score.balls - (6 - i)]?.runs === 4 &&
                    styles.boundary4,
                  scoreLog[score.balls - (6 - i)]?.runs === 6 &&
                    styles.boundary6,
                  scoreLog[score.balls - (6 - i)]?.isWicket &&
                    styles.wicketBall,
                ]}
              >
                {scoreLog[score.balls - (6 - i)]?.runs || ""}
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.controlsCard}>
        <Card.Content style={styles.controlsContent}>
          <View style={styles.runsContainer}>
            {[0, 1, 2, 3, 4, 6].map((runs) => (
              <Button
                key={runs}
                mode={currentBall.runs === runs ? "contained" : "outlined"}
                onPress={() => handleRuns(runs)}
                style={styles.runButton}
                labelStyle={styles.runLabel}
              >
                {runs}
              </Button>
            ))}
          </View>

          <View style={styles.extrasContainer}>
            <Button mode="outlined" onPress={() => addExtra("wd")}>
              Wide
            </Button>
            <Button mode="outlined" onPress={() => addExtra("nb")}>
              No Ball
            </Button>
            <Menu
              visible={showWicketMenu}
              onDismiss={() => setShowWicketMenu(false)}
              anchor={
                <Button
                  mode="contained-tonal"
                  onPress={() => setShowWicketMenu(true)}
                  icon="alert-octagon"
                >
                  Wicket
                </Button>
              }
            >
              {["Bowled", "Caught", "LBW", "Run Out", "Stumped"].map((type) => (
                <Menu.Item
                  key={type}
                  title={type}
                  onPress={() => recordWicket(type)}
                />
              ))}
            </Menu>
          </View>

          <Button
            mode="contained"
            onPress={addBall}
            style={styles.addBallButton}
            labelStyle={styles.addBallLabel}
          >
            Add Ball ({6 - (score.balls % 6)} left in over)
          </Button>
        </Card.Content>
      </Card>

      <ScrollView style={styles.logContainer}>
        {scoreLog.map((ball, idx) => (
          <View key={idx} style={styles.logEntry}>
            <Text style={styles.overBall}>
              {ball.over}.{ball.ball}
            </Text>
            <View style={styles.logDetails}>
              <Text>
                {ball.runs}
                {ball.extras?.map((e) => ` (${e})`)}
              </Text>
              {ball.isWicket && <Icon name="alert-octagon" color="#ff4444" />}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  scorecard: {
    backgroundColor: "#2E7D32",
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamName: {
    color: "white",
  },
  overs: {
    color: "white",
  },
  partnership: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  playersContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  playerCard: {
    flex: 1,
  },
  batsmen: {
    gap: 4,
  },
  striker: {
    fontWeight: "bold",
  },
  overCard: {
    marginBottom: 16,
  },
  overBalls: {
    flexDirection: "row",
    gap: 8,
  },
  ballMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ballCompleted: {
    backgroundColor: "#E0E0E0",
  },
  boundary4: {
    backgroundColor: "#FFF59D",
  },
  boundary6: {
    backgroundColor: "#81C784",
  },
  wicketBall: {
    backgroundColor: "#EF9A9A",
  },
  controlsCard: {
    marginBottom: 16,
  },
  controlsContent: {
    gap: 16,
  },
  runsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  runButton: {
    minWidth: 60,
  },
  runLabel: {
    fontSize: 16,
  },
  extrasContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  addBallButton: {
    marginTop: 8,
  },
  addBallLabel: {
    fontSize: 16,
  },
  logContainer: {
    flex: 1,
  },
  logEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  overBall: {
    color: "#666",
  },
  logDetails: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
