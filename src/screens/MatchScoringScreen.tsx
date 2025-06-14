import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, Dimensions } from "react-native";
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
  ToggleButton,
  Portal,
  Modal,
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

type PlayerRole = "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";

const roleIcons: Record<PlayerRole, string> = {
  Batsman: "account",
  Bowler: "bowl",
  "All-rounder": "all-inclusive",
  "Wicket-keeper": "glasses",
};

const isValidRole = (role: any): role is PlayerRole => {
  return role in roleIcons;
};

// Define Player interface
interface Player {
  name: string;
  role: string;
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
  const [showTeamA, setShowTeamA] = useState(false);
  const [showTeamB, setShowTeamB] = useState(false);
  const [activeTab, setActiveTab] = useState("batting");

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

  const getPlayerRoleIcon = (name: string, team: "A" | "B") => {
    const players = team === "A" ? match.playersA : match.playersB;
    const player = players.find((p: any) => p.name === name);
    const role = player?.role;

    if (role && isValidRole(role)) {
      return roleIcons[role];
    }
    return "account";
  };

  const renderPlayerScorecard = (
    player: Player,
    team: "A" | "B",
    isBatting: boolean
  ) => (
    <View key={player.name} style={styles.playerScoreRow}>
      <View style={styles.playerInfo}>
        <Avatar.Icon size={36} icon={getPlayerRoleIcon(player.name, team)} />
        <View style={styles.playerNameContainer}>
          <Text style={player.name === striker ? styles.striker : {}}>
            {player.name}
            {player.name === striker && " ✳️"}
          </Text>
          <Text style={styles.playerRole}>{player.role}</Text>
        </View>
      </View>

      {isBatting && (
        <View style={styles.statsContainer}>
          <Text style={styles.playerStatValue}>
            {Math.floor(Math.random() * 30)}
          </Text>
          <Text style={styles.playerStatValue}>
            {Math.floor(Math.random() * 20)}
          </Text>
          <Text style={styles.playerStatValue}>
            {Math.floor(Math.random() * 5)}
          </Text>
          <Text style={styles.playerStatValue}>
            {Math.floor(Math.random() * 3)}
          </Text>
          <Text style={[styles.playerStatValue, styles.strikeRate]}>
            {Math.floor(Math.random() * 150 + 50).toFixed(0)}
          </Text>
        </View>
      )}
    </View>
  );

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

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Match Header */}
        <Card style={styles.headerCard} mode="contained">
          <Card.Content>
            <View style={styles.headerRow}>
              <View>
                <Text variant="titleMedium" style={styles.teamName}>
                  {match.teamA}
                </Text>
                <Text variant="bodySmall" style={styles.innings}>
                  Batting
                </Text>
              </View>

              <View style={styles.scoreContainer}>
                <Text variant="headlineLarge" style={styles.scoreText}>
                  {score.runs}
                  <Text style={styles.wickets}>/{score.wickets}</Text>
                </Text>
                <Text variant="titleMedium" style={styles.overs}>
                  ({score.overs}.{score.balls} ov)
                </Text>
              </View>

              <View style={styles.targetContainer}>
                <Text variant="titleMedium" style={styles.teamName}>
                  {match.teamB}
                </Text>
                <Text variant="bodySmall" style={styles.innings}>
                  Bowling
                </Text>
              </View>
            </View>

            <View style={styles.matchInfo}>
              <Text style={styles.matchTitle}>{match.matchTitle}</Text>
              <Text style={styles.matchLocation}>{match.location}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>CRR</Text>
                <Text style={styles.headerStatValue}>{runRate.toFixed(2)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Partnership</Text>
                <Text style={styles.headerStatValue}>
                  {partnership.runs} ({partnership.balls})
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Extras</Text>
                <Text style={styles.headerStatValue}>{score.extras}</Text>
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

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Button
            mode={activeTab === "batting" ? "contained" : "outlined"}
            onPress={() => setActiveTab("batting")}
            style={styles.tabButton}
          >
            Batting
          </Button>
          <Button
            mode={activeTab === "bowling" ? "contained" : "outlined"}
            onPress={() => setActiveTab("bowling")}
            style={styles.tabButton}
          >
            Bowling
          </Button>
          <Button
            mode={activeTab === "scorecard" ? "contained" : "outlined"}
            onPress={() => setActiveTab("scorecard")}
            style={styles.tabButton}
          >
            Scorecard
          </Button>
        </View>

        {/* Batting/Bowling Cards */}
        {activeTab === "batting" && (
          <Card style={styles.batsmenCard} mode="contained">
            <Card.Title
              title="Batting"
              titleVariant="titleMedium"
              left={() => <Icon name="cricket" size={24} />}
              right={() => (
                <IconButton
                  icon="account-group"
                  onPress={() => setShowTeamA(true)}
                />
              )}
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
                  <View style={styles.playerStats}>
                    <Text>24(18) | 4x4, 6x2</Text>
                  </View>
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
                  <View style={styles.playerStats}>
                    <Text>12(8) | 4x1, 6x1</Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {activeTab === "bowling" && (
          <Card style={styles.bowlerCard} mode="contained">
            <Card.Title
              title="Bowling"
              titleVariant="titleMedium"
              left={() => <Icon name="bowl" size={24} />}
              right={() => (
                <IconButton
                  icon="account-group"
                  onPress={() => setShowTeamB(true)}
                />
              )}
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
                  <View style={styles.playerStats}>
                    <Text>3.2-0-28-2 | ER: 8.4</Text>
                  </View>
                </View>
              </View>

              <View style={styles.bowlerStats}>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>Overs</Text>
                  <Text style={styles.headerStatValue}>3.2</Text>
                </View>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>Maidens</Text>
                  <Text style={styles.headerStatValue}>0</Text>
                </View>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>Runs</Text>
                  <Text style={styles.headerStatValue}>28</Text>
                </View>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>Wickets</Text>
                  <Text style={styles.headerStatValue}>2</Text>
                </View>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>ER</Text>
                  <Text style={styles.headerStatValue}>8.4</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {activeTab === "scorecard" && (
          <Card style={styles.scorecardCard} mode="contained">
            <Card.Title
              title="Full Scorecard"
              titleVariant="titleMedium"
              left={() => <Icon name="scoreboard" size={24} />}
            />
            <Card.Content>
              <View style={styles.scorecardHeader}>
                <Text style={styles.scorecardTitle}>Batting</Text>
                <Text style={styles.scorecardSubtitle}>{match.teamA}</Text>
              </View>

              <View style={styles.statsHeader}>
                <Text style={styles.statsHeaderText}>Batsman</Text>
                <Text style={styles.statsHeaderText}>R</Text>
                <Text style={styles.statsHeaderText}>B</Text>
                <Text style={styles.statsHeaderText}>4s</Text>
                <Text style={styles.statsHeaderText}>6s</Text>
                <Text style={styles.statsHeaderText}>SR</Text>
              </View>

              {match.playersA
                .slice(0, 3)
                .map((player: Player) =>
                  renderPlayerScorecard(player, "A", true)
                )}

              <View style={styles.scorecardHeader}>
                <Text style={styles.scorecardTitle}>Bowling</Text>
                <Text style={styles.scorecardSubtitle}>{match.teamB}</Text>
              </View>

              <View style={styles.statsHeader}>
                <Text style={styles.statsHeaderText}>Bowler</Text>
                <Text style={styles.statsHeaderText}>O</Text>
                <Text style={styles.statsHeaderText}>M</Text>
                <Text style={styles.statsHeaderText}>R</Text>
                <Text style={styles.statsHeaderText}>W</Text>
                <Text style={styles.statsHeaderText}>ER</Text>
              </View>

              {match.playersB.slice(0, 2).map((player: Player) => (
                <View key={player.name} style={styles.playerScoreRow}>
                  <View style={styles.playerInfo}>
                    <Avatar.Icon
                      size={36}
                      icon={getPlayerRoleIcon(player.name, "B")}
                    />
                    <View style={styles.playerNameContainer}>
                      <Text>{player.name}</Text>
                      <Text style={styles.playerRole}>{player.role}</Text>
                    </View>
                  </View>

                  <View style={styles.statsContainer}>
                    <Text style={styles.playerStatValue}>3.2</Text>
                    <Text style={styles.playerStatValue}>0</Text>
                    <Text style={styles.playerStatValue}>28</Text>
                    <Text style={styles.playerStatValue}>2</Text>
                    <Text style={[styles.playerStatValue, styles.strikeRate]}>
                      8.4
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Over Progress */}
        <Card style={styles.overCard} mode="contained">
          <Card.Title
            title={`Over ${Math.floor(score.balls / 6) + 1}`}
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

        {/* Scoring Controls */}
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

        {/* Team Modals */}
        <Portal>
          <Modal
            visible={showTeamA}
            onDismiss={() => setShowTeamA(false)}
            contentContainerStyle={styles.modalContent}
          >
            <Card style={styles.modalCard}>
              <Card.Title
                title={match.teamA}
                titleVariant="titleLarge"
                right={() => (
                  <IconButton
                    icon="close"
                    onPress={() => setShowTeamA(false)}
                  />
                )}
              />
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Batsman</Text>
                  <Text style={styles.modalHeaderText}>R</Text>
                  <Text style={styles.modalHeaderText}>B</Text>
                  <Text style={styles.modalHeaderText}>4s</Text>
                  <Text style={styles.modalHeaderText}>6s</Text>
                  <Text style={styles.modalHeaderText}>SR</Text>
                </View>

                {match.playersA.map((player: Player) =>
                  renderPlayerScorecard(player, "A", true)
                )}
              </Card.Content>
            </Card>
          </Modal>

          <Modal
            visible={showTeamB}
            onDismiss={() => setShowTeamB(false)}
            contentContainerStyle={styles.modalContent}
          >
            <Card style={styles.modalCard}>
              <Card.Title
                title={match.teamB}
                titleVariant="titleLarge"
                right={() => (
                  <IconButton
                    icon="close"
                    onPress={() => setShowTeamB(false)}
                  />
                )}
              />
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Bowler</Text>
                  <Text style={styles.modalHeaderText}>O</Text>
                  <Text style={styles.modalHeaderText}>M</Text>
                  <Text style={styles.modalHeaderText}>R</Text>
                  <Text style={styles.modalHeaderText}>W</Text>
                  <Text style={styles.modalHeaderText}>ER</Text>
                </View>

                {match.playersB.map((player: Player) => (
                  <View key={player.name} style={styles.playerScoreRow}>
                    <View style={styles.playerInfo}>
                      <Avatar.Icon
                        size={36}
                        icon={getPlayerRoleIcon(player.name, "B")}
                      />
                      <View style={styles.playerNameContainer}>
                        <Text>{player.name}</Text>
                        <Text style={styles.playerRole}>{player.role}</Text>
                      </View>
                    </View>

                    <View style={styles.statsContainer}>
                      <Text style={styles.playerStatValue}>3.2</Text>
                      <Text style={styles.playerStatValue}>0</Text>
                      <Text style={styles.playerStatValue}>28</Text>
                      <Text style={styles.playerStatValue}>2</Text>
                      <Text style={[styles.playerStatValue, styles.strikeRate]}>
                        8.4
                      </Text>
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </Modal>
        </Portal>
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
    backgroundColor: "#1e3a8a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  teamName: {
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  innings: {
    color: "#ddd",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  scoreContainer: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  targetContainer: {
    alignItems: "flex-end",
  },
  scoreText: {
    fontWeight: "bold",
    lineHeight: 48,
    color: "white",
    fontSize: 36,
  },
  wickets: {
    fontSize: 28,
    fontWeight: "normal",
    color: "#ccc",
  },
  overs: {
    opacity: 0.9,
    color: "white",
    fontSize: 18,
  },
  matchInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  matchTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "white",
    marginBottom: 4,
  },
  matchLocation: {
    opacity: 0.8,
    color: "white",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: "#ddd",
    marginBottom: 4,
  },
  headerStatValue: {
    fontWeight: "bold",
    fontSize: 18,
    color: "white",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  batsmenCard: {
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
  },
  bowlerCard: {
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  playerDetails: {
    flex: 1,
  },
  striker: {
    fontWeight: "bold",
    fontSize: 16,
  },
  playerRole: {
    opacity: 0.7,
    fontSize: 14,
    color: "#555",
  },
  playerStats: {
    marginTop: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 6,
    borderRadius: 6,
  },
  bowlerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 8,
  },
  bowlerStatItem: {
    alignItems: "center",
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
    backgroundColor: "#f8f9fa",
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
    fontSize: 16,
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
    fontSize: 16,
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
  scorecardCard: {
    borderRadius: 12,
  },
  scorecardHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  scorecardTitle: {
    fontWeight: "bold",
    fontSize: 18,
  },
  scorecardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  statsHeaderText: {
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  playerScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  playerNameContainer: {
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    maxWidth: "50%",
  },
  playerStatValue: {
    flex: 1,
    textAlign: "center",
    fontWeight: "500",
  },
  strikeRate: {
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  modalContent: {
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  modalHeaderText: {
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
