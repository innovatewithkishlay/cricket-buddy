import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Button, TextInput, Text, Divider, useTheme } from "react-native-paper";
import { auth, db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { StackNavigationProp } from "@react-navigation/stack";

type Player = { name: string; role: string };
type RootStackParamList = { Home: undefined };
type Props = { navigation: StackNavigationProp<RootStackParamList, "Home"> };

export default function NewMatchScreen({ navigation }: Props) {
  const theme = useTheme();
  const [matchTitle, setMatchTitle] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [overs, setOvers] = useState("");
  const [playersA, setPlayersA] = useState<Player[]>([{ name: "", role: "" }]);
  const [playersB, setPlayersB] = useState<Player[]>([{ name: "", role: "" }]);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors = [];
    if (!matchTitle.trim()) newErrors.push("Match title is required");
    if (!teamA.trim()) newErrors.push("Team A name is required");
    if (!teamB.trim()) newErrors.push("Team B name is required");
    if (playersA.some((p) => !p.name.trim()))
      newErrors.push("All Team A players need names");
    if (playersB.some((p) => !p.name.trim()))
      newErrors.push("All Team B players need names");
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const addPlayer = (team: "A" | "B") => {
    const newPlayer = { name: "", role: "" };
    team === "A"
      ? setPlayersA([...playersA, newPlayer])
      : setPlayersB([...playersB, newPlayer]);
  };

  const removePlayer = (team: "A" | "B", index: number) => {
    team === "A"
      ? setPlayersA(playersA.filter((_, i) => i !== index))
      : setPlayersB(playersB.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (
    text: string,
    index: number,
    field: "name" | "role",
    team: "A" | "B"
  ) => {
    const update = team === "A" ? [...playersA] : [...playersB];
    update[index][field] = text;
    team === "A" ? setPlayersA(update) : setPlayersB(update);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, "users", auth.currentUser.uid, "matches"), {
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
      });
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("Error", "Failed to save match: " + error.message);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text variant="headlineMedium" style={styles.heading}>
        New Cricket Match
      </Text>

      <TextInput
        label="Match Title *"
        value={matchTitle}
        onChangeText={setMatchTitle}
        style={styles.input}
        error={errors.includes("Match title is required")}
      />

      <View style={styles.teamContainer}>
        <TextInput
          label="Team A Name *"
          value={teamA}
          onChangeText={setTeamA}
          style={styles.teamInput}
          error={errors.includes("Team A name is required")}
        />

        {playersA.map((player, index) => (
          <View key={`A-${index}`} style={styles.playerRow}>
            <TextInput
              label={`Player ${index + 1} Name *`}
              value={player.name}
              onChangeText={(t) => handlePlayerChange(t, index, "name", "A")}
              style={styles.playerInput}
              error={
                errors.includes("All Team A players need names") &&
                !player.name.trim()
              }
            />
            <TextInput
              label="Role"
              value={player.role}
              onChangeText={(t) => handlePlayerChange(t, index, "role", "A")}
              style={styles.roleInput}
            />
            {index > 0 && (
              <Button
                mode="text"
                onPress={() => removePlayer("A", index)}
                icon="close"
                style={styles.removeButton}
              />
            )}
          </View>
        ))}
        <Button
          mode="outlined"
          onPress={() => addPlayer("A")}
          style={styles.addButton}
        >
          Add Team A Player
        </Button>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.teamContainer}>
        <TextInput
          label="Team B Name *"
          value={teamB}
          onChangeText={setTeamB}
          style={styles.teamInput}
          error={errors.includes("Team B name is required")}
        />

        {playersB.map((player, index) => (
          <View key={`B-${index}`} style={styles.playerRow}>
            <TextInput
              label={`Player ${index + 1} Name *`}
              value={player.name}
              onChangeText={(t) => handlePlayerChange(t, index, "name", "B")}
              style={styles.playerInput}
              error={
                errors.includes("All Team B players need names") &&
                !player.name.trim()
              }
            />
            <TextInput
              label="Role"
              value={player.role}
              onChangeText={(t) => handlePlayerChange(t, index, "role", "B")}
              style={styles.roleInput}
            />
            {index > 0 && (
              <Button
                mode="text"
                onPress={() => removePlayer("B", index)}
                icon="close"
                style={styles.removeButton}
              />
            )}
          </View>
        ))}
        <Button
          mode="outlined"
          onPress={() => addPlayer("B")}
          style={styles.addButton}
        >
          Add Team B Player
        </Button>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.matchDetails}>
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          icon="calendar"
          style={styles.dateButton}
        >
          {date.toLocaleDateString()}
        </Button>

        {showDatePicker && (
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

        <TextInput
          label="Location"
          value={location}
          onChangeText={setLocation}
          style={styles.input}
          left={<TextInput.Icon icon="map-marker" />}
        />

        <TextInput
          label="Number of Overs"
          value={overs}
          onChangeText={setOvers}
          keyboardType="numeric"
          style={styles.input}
          left={<TextInput.Icon icon="clock" />}
        />
      </View>

      {errors.length > 0 && (
        <View style={styles.errorContainer}>
          {errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              ⚠️ {error}
            </Text>
          ))}
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        labelStyle={styles.submitLabel}
      >
        Create Match
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    marginBottom: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  teamContainer: {
    marginBottom: 25,
  },
  teamInput: {
    marginBottom: 15,
  },
  playerRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  playerInput: {
    flex: 2,
  },
  roleInput: {
    flex: 1.5,
  },
  removeButton: {
    alignSelf: "center",
    marginLeft: 5,
  },
  addButton: {
    marginTop: 10,
  },
  divider: {
    marginVertical: 25,
    height: 1,
  },
  matchDetails: {
    gap: 15,
    marginBottom: 25,
  },
  dateButton: {
    borderColor: "#666",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: "#d32f2f",
    marginVertical: 4,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFFFFF",
  },
});
