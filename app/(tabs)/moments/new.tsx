import { Text } from "@/components/ui/Text";
import { baseColors, sectionColors } from "@/theme/colors";
import { space } from "@/theme/space";
import { text as textTheme } from "@/theme/type";
import { router } from "expo-router";
import {
    CalendarDays,
    Camera,
    ChevronDown,
    ImagePlus,
    X,
} from "lucide-react-native";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INPUT_RADIUS = 20;
const FORM_ACCENT = "rgba(255,45,120,0.25)";
const FIELD_BG = "rgba(255,255,255,0.05)";
const PLACEHOLDER = "rgba(245,240,236,0.5)";
const PHOTO_BORDER = "rgba(107,101,96,0.4)";

export default function NewMomentScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const datePlaceholder = new Date(Date.now()).toLocaleDateString("en-GB");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close new moment"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <X color={baseColors.text} size={24} strokeWidth={2.25} />
          </Pressable>

          <Text style={styles.topBarTitle}>New Moment</Text>

          <Pressable accessibilityRole="button" style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable accessibilityRole="button" style={styles.dropdownField}>
            <Text style={styles.dropdownText}>Moment type</Text>
            <ChevronDown color={baseColors.bg} size={20} strokeWidth={2.5} />
          </Pressable>

          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              placeholder="Give this moment a memorable title..."
              placeholderTextColor={PLACEHOLDER}
              selectionColor={sectionColors.moments}
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Date *</Text>
            <Pressable accessibilityRole="button" style={styles.dateField}>
              <Text style={styles.dateText}>{datePlaceholder}</Text>
              <CalendarDays
                color={baseColors.textSoft}
                size={18}
                strokeWidth={2.1}
              />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              multiline
              placeholder="Describe this special moment..."
              placeholderTextColor={PLACEHOLDER}
              selectionColor={sectionColors.moments}
              style={styles.textArea}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.photosSection}>
            <View style={styles.photosHeader}>
              <Text style={styles.label}>Photos (0)</Text>
              <Pressable accessibilityRole="button">
                <Text style={styles.addPhotoText}>+ Add Photo</Text>
              </Pressable>
            </View>

            <Pressable accessibilityRole="button" style={styles.photoDropzone}>
              <Camera
                color={baseColors.textMuted}
                size={30}
                strokeWidth={1.8}
              />
              <View style={styles.photoHintRow}>
                <ImagePlus
                  color={baseColors.textMuted}
                  size={14}
                  strokeWidth={2}
                />
                <Text style={styles.photoHint}>Tap to add photos</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: baseColors.bg,
  },
  topBar: {
    alignItems: "center",
    borderBottomColor: FORM_ACCENT,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 100,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  topBarTitle: {
    color: baseColors.text,
    fontFamily: textTheme.family.body,
    fontSize: 18,
    lineHeight: 24,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: sectionColors.moments,
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    minWidth: 74,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: baseColors.bg,
    fontFamily: textTheme.family.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
  },
  content: {
    gap: space.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.xxl * 2,
  },
  dropdownField: {
    alignItems: "center",
    backgroundColor: sectionColors.moments,
    borderRadius: 999,
    flexDirection: "row",
    height: 36,
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
  },
  dropdownText: {
    color: baseColors.bg,
    fontFamily: textTheme.family.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
  },
  section: {
    gap: space.sm,
  },
  label: {
    color: baseColors.text,
    fontFamily: textTheme.family.body,
    fontSize: textTheme.size.body,
    lineHeight: 22,
  },
  input: {
    backgroundColor: FIELD_BG,
    borderColor: "transparent",
    borderRadius: INPUT_RADIUS,
    borderWidth: 1.5,
    color: baseColors.text,
    fontFamily: textTheme.family.body,
    fontSize: 14,
    height: 56,
    paddingHorizontal: space.lg,
  },
  dateField: {
    alignItems: "center",
    backgroundColor: FIELD_BG,
    borderColor: FORM_ACCENT,
    borderRadius: INPUT_RADIUS,
    borderWidth: 1.5,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  dateText: {
    color: baseColors.text,
    fontFamily: textTheme.family.body,
    fontSize: 14,
    lineHeight: 18,
  },
  textArea: {
    backgroundColor: FIELD_BG,
    borderColor: "transparent",
    borderRadius: INPUT_RADIUS,
    borderWidth: 1.5,
    color: baseColors.text,
    fontFamily: textTheme.family.body,
    fontSize: 14,
    minHeight: 120,
    padding: space.lg,
  },
  photosSection: {
    gap: space.sm,
  },
  photosHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addPhotoText: {
    color: sectionColors.moments,
    fontFamily: textTheme.family.body,
    fontSize: textTheme.size.body,
    lineHeight: 22,
  },
  photoDropzone: {
    alignItems: "center",
    borderColor: PHOTO_BORDER,
    borderRadius: INPUT_RADIUS,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: space.sm,
    height: 120,
    justifyContent: "center",
  },
  photoHintRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  photoHint: {
    color: baseColors.textMuted,
    fontSize: textTheme.size.caption,
    lineHeight: textTheme.lineHeight.caption,
  },
});
