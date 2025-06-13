import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

export default function PastMatchesScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Past Matches</Text>
      <Text style={{ marginTop: 16, color: "#888" }}>
        This feature will show your match history soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fbfd",
    padding: 24,
  },
});
