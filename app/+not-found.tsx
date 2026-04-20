import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { baseColors, sectionColors } from '../theme/colors';
import { text } from '../theme/type';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Oops! Something went wrong.</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    fontFamily: text.family.semiBold,
    fontSize: 20,
    color: sectionColors.timeline,
    textDecorationLine: 'underline',
  },
  title: {
    color: sectionColors.timeline,
    fontFamily: text.family.semiBold,
    fontSize: 20,
    marginBottom: 20,
  },
});
