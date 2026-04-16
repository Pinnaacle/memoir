import { Text } from "@/components/ui/Text";
import { baseColors, sectionColors } from "@/theme/colors";
import { space } from "@/theme/space";
import { text } from "@/theme/type";
import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function EventsIndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <Text style={styles.text}>Scaffold page for the events index.</Text>
      <View style={styles.links}>
        <Link href="/events/new" style={styles.link}>
          Go to new event
        </Link>
        <Link href="/events/sample-event" style={styles.link}>
          Open sample event
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: sectionColors.events,
    fontSize: text.size.title,
    lineHeight: text.lineHeight.title,
    marginBottom: space.md,
  },
  text: {
    color: baseColors.textMuted,
    textAlign: "center",
  },
  links: {
    marginTop: space.xl,
    alignItems: "center",
  },
  link: {
    color: sectionColors.events,
    fontFamily: text.family.bodyStrong,
    fontSize: text.size.body,
    marginTop: space.md,
    textDecorationLine: "underline",
  },
});
