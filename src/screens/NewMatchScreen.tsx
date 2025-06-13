import React from "react";
import { ScrollView, Text, SafeAreaView, StyleSheet } from "react-native";

export default function NewMatchScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        {[...Array(100)].map((_, i) => (
          <Text key={i} style={{ fontSize: 18, marginBottom: 12 }}>
            Line {i + 1}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
