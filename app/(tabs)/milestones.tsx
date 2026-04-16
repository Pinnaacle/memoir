import { StyleSheet, Text, View } from "react-native";

export default function MilestonesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Milestones</Text>
      <Text style={styles.text}>Scaffold page for milestone highlights.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#f5f0ec",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
  },
  text: {
    color: "#b8b0a8",
    fontSize: 16,
    textAlign: "center",
  },
});
