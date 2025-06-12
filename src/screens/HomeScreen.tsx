import React from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { Text, Card, Button, FAB, useTheme, Avatar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function HomeScreen() {
  const theme = useTheme();

  const user = {
    name: "Kishlay",
    avatar:
      "https://ui-avatars.com/api/?name=Kishlay&background=0D8ABC&color=fff",
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Avatar.Image size={60} source={{ uri: user.avatar }} />
          <View style={{ marginLeft: 16 }}>
            <Text variant="titleLarge" style={styles.greeting}>
              Welcome, {user.name}!
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              Ready for your next cricket match?
            </Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <Card
            style={[styles.card, { backgroundColor: "#f5faff" }]}
            onPress={() => {}}
          >
            <Card.Content style={styles.cardContent}>
              <Icon name="cricket" size={36} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.cardText}>
                Start New Match
              </Text>
            </Card.Content>
          </Card>
          <Card
            style={[styles.card, { backgroundColor: "#fff7f0" }]}
            onPress={() => {}}
          >
            <Card.Content style={styles.cardContent}>
              <Icon name="history" size={36} color="#ff9800" />
              <Text variant="titleMedium" style={styles.cardText}>
                View Past Matches
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.cardRow}>
          <Card
            style={[styles.card, { backgroundColor: "#f6fff5" }]}
            onPress={() => {}}
          >
            <Card.Content style={styles.cardContent}>
              <Icon name="file-export-outline" size={36} color="#4caf50" />
              <Text variant="titleMedium" style={styles.cardText}>
                Export Data
              </Text>
            </Card.Content>
          </Card>
          <Card
            style={[styles.card, { backgroundColor: "#f5f5ff" }]}
            onPress={() => {}}
          >
            <Card.Content style={styles.cardContent}>
              <Icon name="account-circle" size={36} color="#3f51b5" />
              <Text variant="titleMedium" style={styles.cardText}>
                My Profile
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.statsSection}>
          <Text
            variant="titleMedium"
            style={{ marginBottom: 8, color: theme.colors.primary }}
          >
            Quick Stats
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.primary }}
              >
                12
              </Text>
              <Text variant="bodySmall">Matches</Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="headlineSmall" style={{ color: "#4caf50" }}>
                8
              </Text>
              <Text variant="bodySmall">Wins</Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="headlineSmall" style={{ color: "#f44336" }}>
                4
              </Text>
              <Text variant="bodySmall">Losses</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label="New Match"
        style={styles.fab}
        onPress={() => {}}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9fbfd",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    marginTop: 12,
  },
  greeting: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  card: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 18,
  },
  cardText: {
    marginTop: 10,
    textAlign: "center",
    fontWeight: "600",
  },
  statsSection: {
    marginTop: 32,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    backgroundColor: "#1976d2",
    borderRadius: 28,
    elevation: 6,
  },
});
