import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { baseColors, sectionColors } from "../theme/colors";
import { text } from "../theme/type";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops! Not found" }} />
      <View style={styles.container}>
        <Link href="/" style={styles.button}>
          Go to home screen!
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    fontFamily: text.family.bodyStrong,
    fontSize: 20,
    color: sectionColors.moments,
    textDecorationLine: "underline",
  },
});
