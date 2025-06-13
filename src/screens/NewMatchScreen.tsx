import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";

export default function NewMatchScreen() {
  const [fields, setFields] = useState(Array(12).fill(""));

  return (
    <View style={{ flex: 1, backgroundColor: "#faf6ff" }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Create New Match</Text>
        {fields.map((_, idx) => (
          <TextInput
            key={idx}
            label={`Player ${idx + 1} Name`}
            style={styles.input}
            value={fields[idx]}
            onChangeText={(text) => {
              const updated = [...fields];
              updated[idx] = text;
              setFields(updated);
            }}
          />
        ))}
        <Button
          mode="contained"
          style={styles.button}
          onPress={() => alert("Match Created!")}
        >
          Create Match
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: "#8d5cf6",
  },
});
