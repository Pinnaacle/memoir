import { Text } from "@/components/ui/Text";
import { baseColors, sectionColors } from "@/theme/colors";
import { space } from "@/theme/space";
import { text } from "@/theme/type";
import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function EventDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Detail</Text>
      <Text style={styles.text}>Scaffold page for a single event.</Text>
      <View style={styles.links}>
        <Link href="/events" style={styles.link}>
          Back to events
        </Link>
        <Link href="/events/new" style={styles.link}>
          Go to new event
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
    padding: 24,
  },
  title: {
    color: sectionColors.events,
    fontSize: text.size.title,
    lineHeight: text.lineHeight.title,
    marginBottom: space.md,
  },
  text: {
    color: baseColors.textSoft,
    fontSize: 16,
    textAlign: "center",
    marginTop: 4,
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
