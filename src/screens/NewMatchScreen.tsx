import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert, Platform } from "react-native";
import {
  Button,
  TextInput,
  Text,
  Divider,
  useTheme,
  Card,
  Chip,
  IconButton,
  Menu,
} from "react-native-paper";
import { auth, db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { RootStackParamList } from "../navigation/AppNavigator";

type Player = { name: string; role: string };
type Props = {
  navigation: StackNavigationProp<RootStackParamList, "NewMatch">;
};

const ROLE_OPTIONS = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function NewMatchScreen({ navigation }: Props) {
  const theme = useTheme();
  const [matchTitle, setMatchTitle] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [overs, setOvers] = useState("20");
  const [playersA, setPlayersA] = useState<Player[]>([
    { name: "", role: "Batsman" },
  ]);
  const [playersB, setPlayersB] = useState<Player[]>([
    { name: "", role: "Batsman" },
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const [tossWinner, setTossWinner] = useState<"A" | "B">("A");
  const [tossDecision, setTossDecision] = useState<"bat" | "field">("bat");
  const [visibleMenu, setVisibleMenu] = useState<{
    team: "A" | "B";
    index: number;
  } | null>(null);

  const validateForm = () => {
    const newErrors = [];
    if (!matchTitle.trim()) newErrors.push("Match title is required");
    if (!teamA.trim()) newErrors.push("Team A name is required");
    if (!teamB.trim()) newErrors.push("Team B name is required");
    if (playersA.some((p) => !p.name.trim()))
      newErrors.push("All Team A players need names");
    if (playersB.some((p) => !p.name.trim()))
      newErrors.push("All Team B players need names");
    if (!/^\d+$/.test(overs) || +overs < 1 || +overs > 50)
      newErrors.push("Overs must be between 1-50");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const addPlayer = (team: "A" | "B") => {
    const newPlayer = { name: "", role: "Batsman" };
    team === "A"
      ? setPlayersA([...playersA, newPlayer])
      : setPlayersB([...playersB, newPlayer]);
  };

  const removePlayer = (team: "A" | "B", index: number) => {
    if (team === "A" && playersA.length > 1) {
      setPlayersA(playersA.filter((_, i) => i !== index));
    } else if (team === "B" && playersB.length > 1) {
      setPlayersB(playersB.filter((_, i) => i !== index));
    }
  };

  const handlePlayerNameChange = (
    text: string,
    index: number,
    team: "A" | "B"
  ) => {
    const update = team === "A" ? [...playersA] : [...playersB];
    update[index].name = text;
    team === "A" ? setPlayersA(update) : setPlayersB(update);
  };

  const handlePlayerRoleChange = (
    role: string,
    index: number,
    team: "A" | "B"
  ) => {
    const update = team === "A" ? [...playersA] : [...playersB];
    update[index].role = role;
    team === "A" ? setPlayersA(update) : setPlayersB(update);
    setVisibleMenu(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!auth.currentUser) {
      alert("No current user");
      return;
    }
    try {
      const docRef = await addDoc(
        collection(db, "users", auth.currentUser.uid, "matches"),
        {
          matchTitle,
          teamA,
          teamB,
          date: date.toISOString(),
          location,
          overs: Number(overs) || 20,
          playersA,
          playersB,
          createdAt: serverTimestamp(),
          status: "upcoming",
          toss: {
            winner: tossWinner === "A" ? teamA : teamB,
            decision: tossDecision,
          },
        }
      );
      navigation.navigate("MatchScoring", { matchId: docRef.id });
    } catch (error: unknown) {
      Alert.alert("Error", "Failed to save match: " + getErrorMessage(error));
    }
  };

  const renderDatePicker = () => (
    <Button
      mode="outlined"
      onPress={() => setShowDatePicker(true)}
      icon="calendar"
      style={styles.dateButton}
      contentStyle={{ justifyContent: "flex-start" }}
    >
      {date.toLocaleDateString()}
    </Button>
  );

  const renderRoleMenu = (team: "A" | "B", index: number) => (
    <Menu
      visible={visibleMenu?.team === team && visibleMenu?.index === index}
      onDismiss={() => setVisibleMenu(null)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setVisibleMenu({ team, index })}
          style={styles.roleButton}
        >
          {playersA[index]?.role}
        </Button>
      }
    >
      {ROLE_OPTIONS.map((role) => (
        <Menu.Item
          key={role}
          title={role}
          onPress={() => handlePlayerRoleChange(role, index, team)}
        />
      ))}
    </Menu>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text variant="headlineMedium" style={styles.heading}>
          Create New Match
        </Text>

        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Match Details
            </Text>

            <TextInput
              label="Match Title *"
              value={matchTitle}
              onChangeText={setMatchTitle}
              style={styles.input}
              error={errors.includes("Match title is required")}
              mode="outlined"
            />

            <View style={styles.row}>
              <TextInput
                label="Overs *"
                value={overs}
                onChangeText={setOvers}
                style={[styles.input, { flex: 1 }]}
                keyboardType="numeric"
                mode="outlined"
                error={errors.includes("Overs must be between 1-50")}
              />

              <View style={{ flex: 1 }}>
                {renderDatePicker()}
                {showDatePicker && Platform.OS !== "web" && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setShowDatePicker(false);
                      selectedDate && setDate(selectedDate);
                    }}
                  />
                )}
              </View>
            </View>

            <TextInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="map-marker" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Toss
            </Text>

            <View style={styles.tossContainer}>
              <Text style={styles.tossLabel}>Winner:</Text>
              <View style={styles.chipContainer}>
                <Chip
                  mode="outlined"
                  selected={tossWinner === "A"}
                  onPress={() => setTossWinner("A")}
                  style={styles.chip}
                >
                  {teamA || "Team A"}
                </Chip>
                <Chip
                  mode="outlined"
                  selected={tossWinner === "B"}
                  onPress={() => setTossWinner("B")}
                  style={styles.chip}
                >
                  {teamB || "Team B"}
                </Chip>
              </View>

              <Text style={styles.tossLabel}>Decision:</Text>
              <View style={styles.chipContainer}>
                <Chip
                  mode="outlined"
                  selected={tossDecision === "bat"}
                  onPress={() => setTossDecision("bat")}
                  style={styles.chip}
                  icon="cricket"
                >
                  Bat
                </Chip>
                <Chip
                  mode="outlined"
                  selected={tossDecision === "field"}
                  onPress={() => setTossDecision("field")}
                  style={styles.chip}
                  icon="field"
                >
                  Field
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Team A
            </Text>

            <TextInput
              label="Team Name *"
              value={teamA}
              onChangeText={setTeamA}
              style={styles.input}
              mode="outlined"
              error={errors.includes("Team A name is required")}
            />

            <Text style={styles.subtitle}>Players</Text>
            {playersA.map((player, index) => (
              <View key={`A-${index}`} style={styles.playerRow}>
                <TextInput
                  label={`Player ${index + 1} Name *`}
                  value={player.name}
                  onChangeText={(t) => handlePlayerNameChange(t, index, "A")}
                  style={styles.playerInput}
                  mode="outlined"
                  error={
                    errors.includes("All Team A players need names") &&
                    !player.name.trim()
                  }
                />

                {renderRoleMenu("A", index)}

                {playersA.length > 1 && (
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => removePlayer("A", index)}
                    style={styles.removeButton}
                  />
                )}
              </View>
            ))}
            <Button
              mode="outlined"
              onPress={() => addPlayer("A")}
              style={styles.addButton}
              icon="account-plus"
            >
              Add Player
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Team B
            </Text>

            <TextInput
              label="Team Name *"
              value={teamB}
              onChangeText={setTeamB}
              style={styles.input}
              mode="outlined"
              error={errors.includes("Team B name is required")}
            />

            <Text style={styles.subtitle}>Players</Text>
            {playersB.map((player, index) => (
              <View key={`B-${index}`} style={styles.playerRow}>
                <TextInput
                  label={`Player ${index + 1} Name *`}
                  value={player.name}
                  onChangeText={(t) => handlePlayerNameChange(t, index, "B")}
                  style={styles.playerInput}
                  mode="outlined"
                  error={
                    errors.includes("All Team B players need names") &&
                    !player.name.trim()
                  }
                />

                {renderRoleMenu("B", index)}

                {playersB.length > 1 && (
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => removePlayer("B", index)}
                    style={styles.removeButton}
                  />
                )}
              </View>
            ))}
            <Button
              mode="outlined"
              onPress={() => addPlayer("B")}
              style={styles.addButton}
              icon="account-plus"
            >
              Add Player
            </Button>
          </Card.Content>
        </Card>

        {errors.length > 0 && (
          <Card style={[styles.card, styles.errorCard]} mode="contained">
            <Card.Content>
              {errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  ⚠️ {error}
                </Text>
              ))}
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          labelStyle={styles.submitLabel}
          icon="check"
        >
          Create Match
        </Button>
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
    paddingBottom: 32,
  },
  heading: {
    marginBottom: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: "500",
    opacity: 0.8,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  tossContainer: {
    gap: 12,
  },
  tossLabel: {
    fontWeight: "500",
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  playerInput: {
    flex: 2,
  },
  roleButton: {
    flex: 1.5,
    borderColor: "#666",
    borderWidth: 1,
    borderRadius: 4,
  },
  removeButton: {
    marginLeft: 4,
  },
  addButton: {
    marginTop: 8,
  },
  dateButton: {
    borderColor: "#666",
    height: 56,
    justifyContent: "center",
  },
  errorCard: {
    backgroundColor: "#ffebee",
    borderColor: "#f44336",
  },
  errorText: {
    color: "#d32f2f",
    marginVertical: 4,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
