import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { baseColors } from "@/theme/colors";
import { space } from "@/theme/space";
import { ScrollView, StyleSheet } from "react-native";

export default function TimelineScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Card>
        <CardHeader>
          <CardTitle>August 2019</CardTitle>
          <CardDescription>First chapter marker</CardDescription>
        </CardHeader>

        <CardContent style={styles.cardContent}>
          <Text>
            We met on a warm Friday afternoon and ended up talking until the
            cafe chairs were being stacked around us.
          </Text>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xxl * 2,
    gap: space.xl,
  },
  header: {
    gap: space.sm,
  },
  title: {
    textAlign: "left",
  },
  cardContent: {
    gap: space.md,
  },
});
