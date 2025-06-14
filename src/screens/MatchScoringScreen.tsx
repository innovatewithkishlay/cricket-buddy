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
  IconButton,
  Chip,
  ProgressBar,
  Avatar,
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

interface CurrentBallState {
  runs: number;
  extras: string[];
  isWicket: boolean;
  wicketType?: string;
}

const roleIcons = {
  Batsman: "account",
  Bowler: "bowl",
  "All-rounder": "all-inclusive",
  "Wicket-keeper": "glasses",
};

export default function MatchScoringScreen({ route }: Props) {
  const theme = useTheme();
  const { matchId } = route.params;
  const [match, setMatch] = useState<any>(null);
  const [score, setScore] = useState({
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    extras: 0,
  });
  const [currentBall, setCurrentBall] = useState<CurrentBallState>({
    runs: 0,
    extras: [],
    isWicket: false,
    wicketType: undefined,
  });
  const [showWicketMenu, setShowWicketMenu] = useState(false);
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [currentBowler, setCurrentBowler] = useState("");
  const [scoreLog, setScoreLog] = useState<Ball[]>([]);
  const [runRate, setRunRate] = useState(0);
  const [partnership, setPartnership] = useState({ runs: 0, balls: 0 });

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

        if (data.currentScore) {
          setScore({
            runs: data.currentScore,
            wickets: data.currentWickets || 0,
            overs: data.currentOvers || 0,
            balls: data.currentBalls || 0,
            extras: data.currentExtras || 0,
          });
        }
      }
    };
    loadMatch();
  }, [matchId]);

  useEffect(() => {
    if (score.overs > 0 || score.balls > 0) {
      const totalBalls = score.overs * 6 + score.balls;
      setRunRate(totalBalls > 0 ? score.runs / (totalBalls / 6) : 0);
    }
  }, [score]);

  const handleRuns = (runs: number) => {
    setCurrentBall((prev) => ({ ...prev, runs }));
  };

  const addExtra = (extra: string) => {
    setCurrentBall((prev) => ({
      ...prev,
      extras: [...new Set([...prev.extras, extra])],
      runs: extra === "wd" || extra === "nb" ? prev.runs + 1 : prev.runs,
    }));
  };

  const removeExtra = (extra: string) => {
    setCurrentBall((prev) => ({
      ...prev,
      extras: prev.extras.filter((e) => e !== extra),
      runs:
        extra === "wd" || extra === "nb"
          ? Math.max(0, prev.runs - 1)
          : prev.runs,
    }));
  };

  const recordWicket = (type: string) => {
    setShowWicketMenu(false);
    setCurrentBall((prev) => ({ ...prev, isWicket: true, wicketType: type }));
  };

  const addBall = async () => {
    if (!auth.currentUser || !match) return;

    const extraRuns =
      currentBall.extras.includes("wd") || currentBall.extras.includes("nb")
        ? 1
        : 0;
    const totalRuns = currentBall.runs + extraRuns;

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
      runs: prev.runs + totalRuns,
      wickets: prev.wickets + (currentBall.isWicket ? 1 : 0),
      overs: Math.floor((prev.balls + 1) / 6),
      balls: prev.balls + 1,
      extras: prev.extras + extraRuns,
    }));

    if (currentBall.runs % 2 !== 0 && !currentBall.isWicket) {
      setStriker(nonStriker);
      setNonStriker(striker);
    }

    if (currentBall.isWicket) {
      const nextBatsman = match.playersA.find(
        (p: any) => p.name !== striker && p.name !== nonStriker
      )?.name;
      if (nextBatsman) setStriker(nextBatsman);
      setPartnership({ runs: 0, balls: 0 });
    } else {
      setPartnership((prev) => ({
        runs: prev.runs + currentBall.runs,
        balls: prev.balls + 1,
      }));
    }

    const matchRef = doc(db, "users", auth.currentUser.uid, "matches", matchId);
    await updateDoc(matchRef, {
      scoreLog: arrayUnion(newBall),
      currentScore: score.runs + totalRuns,
      currentWickets: score.wickets + (currentBall.isWicket ? 1 : 0),
      currentOvers: Math.floor((score.balls + 1) / 6),
      currentBalls: (score.balls + 1) % 6,
      currentExtras: score.extras + extraRuns,
    });

    setScoreLog((prev) => [...prev, newBall]);
    setCurrentBall({
      runs: 0,
      extras: [],
      isWicket: false,
      wicketType: undefined,
    });
  };

  if (!match) {
    return (
      <View style={styles.centered}>
        <Text>Loading match...</Text>
      </View>
    );
  }

  const totalBalls = match.overs * 6;
  const ballsBowled = score.overs * 6 + score.balls;
  const overProgress = ballsBowled / totalBalls;

  const getPlayerRoleIcon = (name: string, team: "A" | "B") => {
    const players = team === "A" ? match.playersA : match.playersB;
    const player = players.find((p: any) => p.name === name);
    return roleIcons[player?.role] || "account";
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.headerCard} mode="contained">
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="titleLarge" style={styles.teamName}>
                {match.teamA}
              </Text>
              <View style={styles.scoreContainer}>
                <Text variant="headlineLarge" style={styles.scoreText}>
                  {score.runs}
                  <Text style={styles.wickets}>/{score.wickets}</Text>
                </Text>
                <Text variant="titleMedium" style={styles.overs}>
                  ({score.overs}.{score.balls} ov)
                </Text>
              </View>
              <Text variant="titleLarge" style={styles.teamName}>
                {match.teamB}
              </Text>
            </View>

            <View style={styles.matchInfo}>
              <Text style={styles.matchTitle}>{match.matchTitle}</Text>
              <Text style={styles.matchLocation}>{match.location}</Text>
              <Text style={styles.matchDate}>
                {new Date(match.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Run Rate</Text>
                <Text style={styles.statValue}>{runRate.toFixed(2)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Partnership</Text>
                <Text style={styles.statValue}>
                  {partnership.runs} ({partnership.balls})
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Extras</Text>
                <Text style={styles.statValue}>{score.extras}</Text>
              </View>
            </View>

            <ProgressBar
              progress={overProgress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <View style={styles.progressLabels}>
              <Text>
                Overs: {score.overs}.{score.balls}
              </Text>
              <Text>{match.overs} overs</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.cardsRow}>
          <Card
            style={[styles.playerCard, styles.batsmenCard]}
            mode="contained"
          >
            <Card.Title
              title="Batting"
              titleVariant="titleMedium"
              left={() => <Icon name="cricket" size={24} />}
            />
            <Card.Content>
              <View style={styles.playerInfo}>
                <Avatar.Icon size={40} icon={getPlayerRoleIcon(striker, "A")} />
                <View style={styles.playerDetails}>
                  <Text variant="bodyLarge" style={styles.striker}>
                    {striker} ✳️
                  </Text>
                  <Text variant="bodyMedium" style={styles.playerRole}>
                    {match.playersA.find((p: any) => p.name === striker)?.role}
                  </Text>
                </View>
              </View>

              <View style={styles.playerInfo}>
                <Avatar.Icon
                  size={40}
                  icon={getPlayerRoleIcon(nonStriker, "A")}
                />
                <View style={styles.playerDetails}>
                  <Text variant="bodyLarge">{nonStriker}</Text>
                  <Text variant="bodyMedium" style={styles.playerRole}>
                    {
                      match.playersA.find((p: any) => p.name === nonStriker)
                        ?.role
                    }
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={[styles.playerCard, styles.bowlerCard]} mode="contained">
            <Card.Title
              title="Bowling"
              titleVariant="titleMedium"
              left={() => <Icon name="bowl" size={24} />}
            />
            <Card.Content>
              <View style={styles.playerInfo}>
                <Avatar.Icon
                  size={40}
                  icon={getPlayerRoleIcon(currentBowler, "B")}
                />
                <View style={styles.playerDetails}>
                  <Text variant="bodyLarge">{currentBowler}</Text>
                  <Text variant="bodyMedium" style={styles.playerRole}>
                    {
                      match.playersB.find((p: any) => p.name === currentBowler)
                        ?.role
                    }
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.overCard} mode="contained">
          <Card.Title
            title="Current Over"
            titleVariant="titleMedium"
            left={() => <Icon name="progress-clock" size={24} />}
          />
          <Card.Content>
            <View style={styles.overBalls}>
              {[...Array(6)].map((_, i) => {
                const ballIndex = score.balls - (6 - i);
                const ballData = ballIndex >= 0 ? scoreLog[ballIndex] : null;

                return (
                  <View
                    key={i}
                    style={[
                      styles.ballMarker,
                      ballData && styles.ballCompleted,
                      ballData?.runs === 4 && styles.boundary4,
                      ballData?.runs === 6 && styles.boundary6,
                      ballData?.isWicket && styles.wicketBall,
                      i === score.balls % 6 && styles.currentBall,
                    ]}
                  >
                    {ballData ? (
                      ballData.isWicket ? (
                        <Icon name="close" size={20} color="#fff" />
                      ) : (
                        <Text style={styles.ballText}>
                          {ballData.runs}
                          {ballData.extras?.includes("wd") && "wd"}
                          {ballData.extras?.includes("nb") && "nb"}
                        </Text>
                      )
                    ) : i === score.balls % 6 ? (
                      "•"
                    ) : (
                      ""
                    )}
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.controlsCard} mode="contained">
          <Card.Title title="Record Ball" titleVariant="titleMedium" />
          <Card.Content style={styles.controlsContent}>
            <View style={styles.runsContainer}>
              {[0, 1, 2, 3, 4, 6].map((runs) => (
                <Button
                  key={runs}
                  mode={currentBall.runs === runs ? "contained" : "outlined"}
                  onPress={() => handleRuns(runs)}
                  style={styles.runButton}
                  labelStyle={styles.runLabel}
                  compact
                >
                  {runs}
                </Button>
              ))}
            </View>

            <View style={styles.extrasContainer}>
              <Text style={styles.sectionLabel}>Extras:</Text>
              {["wd", "nb", "b", "lb"].map((extra) => (
                <Chip
                  key={extra}
                  mode={
                    currentBall.extras.includes(extra) ? "flat" : "outlined"
                  }
                  onPress={() =>
                    currentBall.extras.includes(extra)
                      ? removeExtra(extra)
                      : addExtra(extra)
                  }
                  icon={
                    extra === "wd"
                      ? "arrow-expand-horizontal"
                      : extra === "nb"
                      ? "alert-circle"
                      : "run-fast"
                  }
                  style={styles.extraChip}
                >
                  {extra === "wd"
                    ? "Wide"
                    : extra === "nb"
                    ? "No Ball"
                    : extra === "b"
                    ? "Bye"
                    : "Leg Bye"}
                </Chip>
              ))}
            </View>

            <View style={styles.extrasContainer}>
              <Text style={styles.sectionLabel}>Wicket:</Text>
              <Menu
                visible={showWicketMenu}
                onDismiss={() => setShowWicketMenu(false)}
                anchor={
                  <Chip
                    mode={currentBall.isWicket ? "flat" : "outlined"}
                    icon="alert-octagon"
                    onPress={() => setShowWicketMenu(true)}
                    style={[
                      styles.extraChip,
                      currentBall.isWicket && styles.wicketChip,
                    ]}
                  >
                    {currentBall.wicketType || "Wicket"}
                  </Chip>
                }
              >
                {["Bowled", "Caught", "LBW", "Run Out", "Stumped"].map(
                  (type) => (
                    <Menu.Item
                      key={type}
                      title={type}
                      onPress={() => recordWicket(type)}
                    />
                  )
                )}
              </Menu>
            </View>

            <Button
              mode="contained"
              onPress={addBall}
              style={styles.addBallButton}
              labelStyle={styles.addBallLabel}
              icon="plus-circle"
              disabled={
                currentBall.runs === 0 &&
                currentBall.extras.length === 0 &&
                !currentBall.isWicket
              }
            >
              Add Ball ({6 - (score.balls % 6)} left)
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.logCard} mode="contained">
          <Card.Title
            title="Ball-by-Ball Log"
            titleVariant="titleMedium"
            left={() => <Icon name="history" size={24} />}
          />
          <Card.Content>
            <ScrollView style={styles.logContainer}>
              {scoreLog.map((ball, idx) => (
                <View key={idx} style={styles.logEntry}>
                  <Text style={styles.overBall}>
                    {ball.over}.{ball.ball}
                  </Text>
                  <View style={styles.logDetails}>
                    <Text>
                      <Text style={ball.runs > 3 ? styles.boundaryText : {}}>
                        {ball.runs}
                      </Text>
                      {ball.extras?.map(
                        (e) =>
                          ` (${
                            e === "wd"
                              ? "Wide"
                              : e === "nb"
                              ? "No Ball"
                              : e === "b"
                              ? "Bye"
                              : "Leg Bye"
                          })`
                      )}
                    </Text>
                    {ball.isWicket && (
                      <Icon name="alert-octagon" size={16} color="#ff4444" />
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  headerCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  teamName: {
    fontWeight: "bold",
    flex: 1,
  },
  scoreContainer: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  scoreText: {
    fontWeight: "bold",
    lineHeight: 48,
  },
  wickets: {
    fontSize: 24,
    fontWeight: "normal",
  },
  overs: {
    opacity: 0.8,
  },
  matchInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  matchTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  matchLocation: {
    opacity: 0.8,
  },
  matchDate: {
    opacity: 0.6,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statValue: {
    fontWeight: "bold",
    fontSize: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 16,
  },
  playerCard: {
    flex: 1,
    borderRadius: 12,
  },
  batsmenCard: {
    backgroundColor: "#E8F5E9",
  },
  bowlerCard: {
    backgroundColor: "#E3F2FD",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  playerDetails: {
    flex: 1,
  },
  striker: {
    fontWeight: "bold",
  },
  playerRole: {
    opacity: 0.7,
    fontSize: 14,
  },
  overCard: {
    borderRadius: 12,
  },
  overBalls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  ballMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  ballCompleted: {
    backgroundColor: "#E0E0E0",
  },
  currentBall: {
    borderWidth: 2,
    borderColor: "#FF9800",
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
  ballText: {
    fontWeight: "bold",
  },
  controlsCard: {
    borderRadius: 12,
  },
  controlsContent: {
    gap: 16,
    paddingVertical: 8,
  },
  runsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  runButton: {
    width: 60,
  },
  runLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  extrasContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  sectionLabel: {
    fontWeight: "500",
  },
  extraChip: {
    marginRight: 4,
  },
  wicketChip: {
    backgroundColor: "#ffebee",
  },
  addBallButton: {
    marginTop: 8,
  },
  addBallLabel: {
    fontSize: 16,
  },
  logCard: {
    borderRadius: 12,
    maxHeight: 200,
  },
  logContainer: {
    maxHeight: 150,
  },
  logEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  overBall: {
    fontWeight: "500",
  },
  logDetails: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  boundaryText: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
