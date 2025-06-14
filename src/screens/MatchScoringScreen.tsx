import React, { useState, useEffect, useMemo } from "react";
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
  extra?: string;
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

interface Player {
  name: string;
  role: string;
}

interface PlayerStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  strikeRate: number;
}

interface BowlerStats {
  runs: number;
  balls: number;
  maidens: number;
  wickets: number;
  economy: number;
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
    extra: undefined,
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
        setScoreLog(data.scoreLog || []);

        if (data.currentScore) {
          setScore({
            runs: data.currentScore,
            wickets: data.currentWickets || 0,
            overs: data.currentOvers || 0,
            balls: data.currentBalls || 0,
            extras: data.currentExtras || 0,
          });
        }

        // Initialize partnership
        if (data.scoreLog && data.scoreLog.length > 0) {
          const lastWicketIndex = [...data.scoreLog]
            .reverse()
            .findIndex((b) => b.isWicket);
          const ballsSinceWicket =
            lastWicketIndex >= 0
              ? data.scoreLog.slice(data.scoreLog.length - lastWicketIndex)
              : data.scoreLog;

          const partnershipRuns = ballsSinceWicket.reduce(
            (sum, ball) => sum + ball.runs,
            0
          );
          const partnershipBalls = ballsSinceWicket.filter(
            (b) => !b.extras?.includes("wd")
          ).length;

          setPartnership({ runs: partnershipRuns, balls: partnershipBalls });
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

  // Calculate batsman statistics from score log
  const batsmanStats = useMemo(() => {
    const stats: Record<string, PlayerStats> = {};

    scoreLog.forEach((ball) => {
      // Initialize player if not exists
      if (!stats[ball.batsman]) {
        stats[ball.batsman] = {
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          strikeRate: 0,
        };
      }

      const playerStat = stats[ball.batsman];

      // Only count valid balls (not extras that don't count against batsman)
      if (!ball.extras?.includes("wd") && !ball.extras?.includes("nb")) {
        playerStat.balls++;

        // Add runs if not extras that don't credit batsman
        if (!ball.extras?.includes("b") && !ball.extras?.includes("lb")) {
          playerStat.runs += ball.runs;

          // Count boundaries
          if (ball.runs === 4) playerStat.fours++;
          if (ball.runs === 6) playerStat.sixes++;
        }
      }

      // Mark as out if wicket
      if (ball.isWicket && ball.batsman === ball.batsman) {
        playerStat.isOut = true;
      }

      // Calculate strike rate
      if (playerStat.balls > 0) {
        playerStat.strikeRate = Number(
          ((playerStat.runs / playerStat.balls) * 100).toFixed(2)
        );
      }
    });

    return stats;
  }, [scoreLog]);

  // Calculate bowler statistics from score log
  const bowlerStats = useMemo(() => {
    const stats: Record<string, BowlerStats> = {};

    scoreLog.forEach((ball) => {
      // Initialize bowler if not exists
      if (!stats[ball.bowler]) {
        stats[ball.bowler] = {
          runs: 0,
          balls: 0,
          maidens: 0, // Will need to calculate maidens separately
          wickets: 0,
          economy: 0,
        };
      }

      const bowlerStat = stats[ball.bowler];

      // Count balls (except wides)
      if (!ball.extras?.includes("wd")) {
        bowlerStat.balls++;
      }

      // Add runs (all runs count against bowler)
      bowlerStat.runs += ball.runs;
      if (ball.extras?.includes("wd") || ball.extras?.includes("nb")) {
        bowlerStat.runs += 1; // Penalty runs
      }

      // Count wickets
      if (ball.isWicket) {
        bowlerStat.wickets++;
      }

      // Calculate economy
      if (bowlerStat.balls > 0) {
        bowlerStat.economy = Number(
          ((bowlerStat.runs / bowlerStat.balls) * 6).toFixed(2)
        );
      }
    });

    // Calculate maidens (overs with no runs)
    Object.keys(stats).forEach((bowler) => {
      // This is simplified - would need to track by over
      stats[bowler].maidens = 0;
    });

    return stats;
  }, [scoreLog]);

  const handleRuns = (runs: number) => {
    setCurrentBall((prev) => ({ ...prev, runs }));
  };

  const toggleExtra = (extra: string) => {
    setCurrentBall((prev) => {
      // If clicking the same extra, remove it
      if (prev.extra === extra) {
        return {
          ...prev,
          extra: undefined,
          runs:
            extra === "wd" || extra === "nb"
              ? Math.max(0, prev.runs - 1)
              : prev.runs,
        };
      }
      // Otherwise, set the new extra
      else {
        return {
          ...prev,
          extra,
          runs: extra === "wd" || extra === "nb" ? prev.runs + 1 : prev.runs,
        };
      }
    });
  };

  const recordWicket = (type: string) => {
    setShowWicketMenu(false);
    setCurrentBall((prev) => ({ ...prev, isWicket: true, wicketType: type }));
  };

  const addBall = async () => {
    if (!auth.currentUser || !match) return;

    const extraRuns =
      currentBall.extra === "wd" || currentBall.extra === "nb" ? 1 : 0;
    const totalRuns = currentBall.runs + extraRuns;

    const newBall: Ball = {
      over: Math.floor(score.balls / 6) + 1,
      ball: (score.balls % 6) + 1,
      runs: currentBall.runs,
      batsman: striker,
      bowler: currentBowler,
      isWicket: currentBall.isWicket,
      wicketType: currentBall.wicketType,
      extras: currentBall.extra ? [currentBall.extra] : undefined,
      timestamp: new Date().toISOString(),
    };

    // Update score state
    const newScore = {
      runs: score.runs + totalRuns,
      wickets: score.wickets + (currentBall.isWicket ? 1 : 0),
      overs: Math.floor((score.balls + 1) / 6),
      balls: (score.balls + 1) % 6,
      extras: score.extras + extraRuns,
    };

    setScore(newScore);

    // Update partnership
    const newPartnership = currentBall.isWicket
      ? { runs: 0, balls: 0 }
      : {
          runs: partnership.runs + currentBall.runs,
          balls: partnership.balls + 1,
        };

    setPartnership(newPartnership);

    // Rotate strike on odd runs
    if (currentBall.runs % 2 !== 0 && !currentBall.isWicket) {
      [striker, nonStriker] = [nonStriker, striker];
      setStriker(nonStriker);
      setNonStriker(striker);
    }

    // Handle wickets
    if (currentBall.isWicket) {
      const nextBatsman = match.playersA.find(
        (p: any) => p.name !== striker && p.name !== nonStriker
      )?.name;
      if (nextBatsman) setStriker(nextBatsman);
    }

    // Update Firestore
    const matchRef = doc(db, "users", auth.currentUser.uid, "matches", matchId);
    await updateDoc(matchRef, {
      scoreLog: arrayUnion(newBall),
      currentScore: newScore.runs,
      currentWickets: newScore.wickets,
      currentOvers: newScore.overs,
      currentBalls: newScore.balls,
      currentExtras: newScore.extras,
    });

    // Update local state
    setScoreLog((prev) => [...prev, newBall]);
    setCurrentBall({
      runs: 0,
      extra: undefined,
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

  const formatBallResult = (ball: Ball) => {
    if (ball.isWicket) return "W";
    if (ball.extras?.includes("wd")) return "WD";
    if (ball.extras?.includes("nb")) return "NB";
    if (ball.extras?.includes("b")) return "B";
    if (ball.extras?.includes("lb")) return "LB";
    if (ball.runs === 0) return "•";
    return ball.runs.toString();
  };

  const getBallColor = (ball: Ball) => {
    if (ball.isWicket) return "#EF9A9A"; // Red for wicket
    if (ball.runs === 4) return "#90CAF9"; // Blue for four
    if (ball.runs === 6) return "#A5D6A7"; // Green for six
    if (ball.extras?.length) return "#FFF59D"; // Yellow for extras
    if (ball.runs === 0) return "#E0E0E0"; // Gray for dot
    return "#F5F5F5"; // Default
  };

  const renderPlayerScorecard = (
    player: Player,
    team: "A" | "B",
    isBatting: boolean
  ) => {
    const stats = batsmanStats[player.name] || {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      strikeRate: 0,
    };

    return (
      <View key={player.name} style={styles.playerScoreRow}>
        <View style={styles.playerInfo}>
          <Avatar.Icon size={36} icon={getPlayerRoleIcon(player.name, team)} />
          <View style={styles.playerNameContainer}>
            <Text style={player.name === striker ? styles.striker : {}}>
              {player.name}
              {player.name === striker && " ✳️"}
              {stats.isOut && " 🏏"}
            </Text>
            <Text style={styles.playerRole}>{player.role}</Text>
          </View>
        </View>

        {isBatting && (
          <View style={styles.statsContainer}>
            <Text style={styles.playerStatValue}>{stats.runs}</Text>
            <Text style={styles.playerStatValue}>{stats.balls}</Text>
            <Text style={styles.playerStatValue}>{stats.fours}</Text>
            <Text style={styles.playerStatValue}>{stats.sixes}</Text>
            <Text style={[styles.playerStatValue, styles.strikeRate]}>
              {stats.strikeRate}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderBowlerScorecard = (player: Player) => {
    const stats = bowlerStats[player.name] || {
      runs: 0,
      balls: 0,
      maidens: 0,
      wickets: 0,
      economy: 0,
    };

    const overs = Math.floor(stats.balls / 6);
    const balls = stats.balls % 6;

    return (
      <View key={player.name} style={styles.playerScoreRow}>
        <View style={styles.playerInfo}>
          <Avatar.Icon size={36} icon={getPlayerRoleIcon(player.name, "B")} />
          <View style={styles.playerNameContainer}>
            <Text>{player.name}</Text>
            <Text style={styles.playerRole}>{player.role}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.playerStatValue}>{`${overs}.${balls}`}</Text>
          <Text style={styles.playerStatValue}>{stats.maidens}</Text>
          <Text style={styles.playerStatValue}>{stats.runs}</Text>
          <Text style={styles.playerStatValue}>{stats.wickets}</Text>
          <Text style={[styles.playerStatValue, styles.strikeRate]}>
            {stats.economy}
          </Text>
        </View>
      </View>
    );
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

  const strikerStats = batsmanStats[striker] || {
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
  };

  const nonStrikerStats = batsmanStats[nonStriker] || {
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
  };

  const bowlerStatsCurrent = bowlerStats[currentBowler] || {
    runs: 0,
    balls: 0,
    maidens: 0,
    wickets: 0,
    economy: 0,
  };

  // Get balls for current over
  const currentOver = Math.floor(score.balls / 6) + 1;
  const currentOverBalls = scoreLog.filter((ball) => ball.over === currentOver);

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
          <>
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
                  <Avatar.Icon
                    size={40}
                    icon={getPlayerRoleIcon(striker, "A")}
                  />
                  <View style={styles.playerDetails}>
                    <Text variant="bodyLarge" style={styles.striker}>
                      {striker} ✳️
                    </Text>
                    <Text variant="bodyMedium" style={styles.playerRole}>
                      {
                        match.playersA.find((p: any) => p.name === striker)
                          ?.role
                      }
                    </Text>
                    <View style={styles.playerStats}>
                      <Text>
                        {strikerStats.runs}({strikerStats.balls}) | 4x
                        {strikerStats.fours}, 6x{strikerStats.sixes} | SR:{" "}
                        {strikerStats.strikeRate}
                      </Text>
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
                      <Text>
                        {nonStrikerStats.runs}({nonStrikerStats.balls}) | 4x
                        {nonStrikerStats.fours}, 6x{nonStrikerStats.sixes} | SR:{" "}
                        {nonStrikerStats.strikeRate}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Over Progress */}
            <Card style={styles.overCard} mode="contained">
              <Card.Title
                title={`Over ${currentOver}`}
                titleVariant="titleMedium"
                left={() => <Icon name="progress-clock" size={24} />}
              />
              <Card.Content>
                <View style={styles.overBalls}>
                  {[...Array(6)].map((_, i) => {
                    const ballData = currentOverBalls[i] || null;

                    return (
                      <View
                        key={i}
                        style={[
                          styles.ballMarker,
                          ballData && {
                            backgroundColor: getBallColor(ballData),
                          },
                          i === score.balls % 6 && styles.currentBall,
                        ]}
                      >
                        {ballData ? (
                          <Text style={styles.ballText}>
                            {formatBallResult(ballData)}
                          </Text>
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

            {/* Scoring Controls - Only in Batting Tab */}
            <Card style={styles.controlsCard} mode="contained">
              <Card.Title title="Record Ball" titleVariant="titleMedium" />
              <Card.Content style={styles.controlsContent}>
                <View style={styles.runsContainer}>
                  {[0, 1, 2, 3, 4, 6].map((runs) => (
                    <Button
                      key={runs}
                      mode={
                        currentBall.runs === runs ? "contained" : "outlined"
                      }
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
                      mode={currentBall.extra === extra ? "flat" : "outlined"}
                      onPress={() => toggleExtra(extra)}
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
                    !currentBall.extra &&
                    !currentBall.isWicket
                  }
                >
                  Add Ball ({6 - (score.balls % 6)} left)
                </Button>
              </Card.Content>
            </Card>
          </>
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
                    <Text>
                      {bowlerStatsCurrent.runs}-{bowlerStatsCurrent.wickets} |
                      ER: {bowlerStatsCurrent.economy}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.bowlerStats}>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>Overs</Text>
                  <Text style={styles.headerStatValue}>
                    {Math.floor(bowlerStatsCurrent.balls / 6)}.
                    {bowlerStatsCurrent.balls % 6}
                  </Text>
                </View>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>Maidens</Text>
                  <Text style={styles.headerStatValue}>
                    {bowlerStatsCurrent.maidens}
                  </Text>
                </View>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>Runs</Text>
                  <Text style={styles.headerStatValue}>
                    {bowlerStatsCurrent.runs}
                  </Text>
                </View>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>Wickets</Text>
                  <Text style={styles.headerStatValue}>
                    {bowlerStatsCurrent.wickets}
                  </Text>
                </View>
                <View style={styles.bowlerStatItem}>
                  <Text style={styles.statLabel}>ER</Text>
                  <Text style={styles.headerStatValue}>
                    {bowlerStatsCurrent.economy}
                  </Text>
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

              {match.playersA.map((player: Player) =>
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

              {match.playersB.map((player: Player) =>
                renderBowlerScorecard(player)
              )}
            </Card.Content>
          </Card>
        )}

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

                {match.playersB.map((player: Player) =>
                  renderBowlerScorecard(player)
                )}
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
  currentBall: {
    borderWidth: 2,
    borderColor: "#FF9800",
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
