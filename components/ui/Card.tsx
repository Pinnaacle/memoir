import { Text, TextColorContext } from "@/components/ui/Text";
import { baseColors } from "@/theme/colors";
import { radius } from "@/theme/radius";
import { space } from "@/theme/space";
import { text as textTheme } from "@/theme/type";
import { StyleSheet, View } from "react-native";

function Card({ style, ...props }: React.ComponentProps<typeof View>) {
  return (
    <TextColorContext.Provider value={baseColors.text}>
      <View style={[styles.card, style]} {...props} />
    </TextColorContext.Provider>
  );
}

function CardHeader({ style, ...props }: React.ComponentProps<typeof View>) {
  return <View style={[styles.header, style]} {...props} />;
}

function CardTitle({ style, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text
      role="heading"
      aria-level={3}
      style={[styles.title, style]}
      {...props}
    />
  );
}

function CardDescription({
  style,
  ...props
}: React.ComponentProps<typeof Text>) {
  return <Text style={[styles.description, style]} {...props} />;
}

function CardContent({ style, ...props }: React.ComponentProps<typeof View>) {
  return <View style={[styles.content, style]} {...props} />;
}

function CardFooter({ style, ...props }: React.ComponentProps<typeof View>) {
  return <View style={[styles.footer, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: baseColors.card,
    borderColor: baseColors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.xl,
    paddingVertical: space.xl,
    shadowColor: baseColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 2,
  },
  header: {
    gap: space.sm,
    paddingHorizontal: space.xl,
  },
  title: {
    fontFamily: textTheme.family.bodyStrong,
    lineHeight: textTheme.lineHeight.body,
  },
  description: {
    color: baseColors.textMuted,
    fontSize: textTheme.size.caption,
    lineHeight: textTheme.lineHeight.caption,
  },
  content: {
    paddingHorizontal: space.xl,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: space.xl,
  },
});

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
