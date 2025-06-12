import { Button } from "react-native-paper";
import { View, StyleSheet } from "react-native";
import { auth } from "../firebase/firebase";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={() => auth.signOut()}>
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
