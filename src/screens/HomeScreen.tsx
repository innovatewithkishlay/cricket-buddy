import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Modal, Pressable } from "react-native";
import { Text, Card, Button, FAB, useTheme, Avatar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";

export default function HomeScreen() {
  const theme = useTheme();
  const [profileVisible, setProfileVisible] = useState(false);

  const user = {
    name: auth.currentUser?.displayName || "Kishlay sinha",
    email: auth.currentUser?.email || "kishlay@example.com",
    avatar:
      "https://ui-avatars.com/api/?name=" +
      (auth.currentUser?.displayName || "Kishlay") +
      "&background=0D8ABC&color=fff",
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setProfileVisible(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => setProfileVisible(true)}>
            <Avatar.Image size={60} source={{ uri: user.avatar }} />
          </Pressable>
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

      <Modal
        visible={profileVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Avatar.Image
              size={72}
              source={{ uri: user.avatar }}
              style={{ alignSelf: "center" }}
            />
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Button
              mode="contained"
              style={styles.signOutButton}
              onPress={handleSignOut}
              icon="logout"
              buttonColor="#f44336"
              textColor="#fff"
            >
              Sign Out
            </Button>
            <Button
              onPress={() => setProfileVisible(false)}
              style={{ marginTop: 8 }}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  profileEmail: {
    fontSize: 16,
    color: "#555",
    marginTop: 6,
    marginBottom: 24,
    textAlign: "center",
  },
  signOutButton: {
    marginTop: 12,
    width: "100%",
    borderRadius: 8,
  },
});
