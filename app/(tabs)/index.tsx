import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { signOut } from '@/lib/auth';
import { baseColors, sectionColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

export default function TimelineScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Button
        color={sectionColors.moments}
        title="Create new memory"
        variant="round"
        onPress={() => console.log('Create new memory')}
      />
      <Button
        color={sectionColors.events}
        title="Go to sign in (test)"
        variant="default"
        onPress={() => router.push('/sign-in')}
      />
      <Button
        color={sectionColors.timeline}
        title="Log out (test)"
        variant="default"
        onPress={async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Failed to sign out', error);
          }
        }}
      />
      <Card
        variant="default"
        title="Indflyttergave fra Eline"
        date="March 14, 2026"
        type="Special Moment"
        description="Fine kopper fordi vi drikker te konstant"
        coverImage="https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg"
      />
      <Card
        location="Aarhus"
        variant="compressed"
        title="Indflyttergave fra Eline"
        date="March 14, 2026"
        type="Special Moment"
        description="Fine kopper fordi vi drikker te konstant"
        coverImage="https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg"
      />
      <Card
        icon="plain"
        variant="detailed"
        title="Indflyttergave fra Eline"
        date="March 14, 2026"
        type="Special Moment"
        description="Fine kopper fordi vi drikker te konstant"
        images={[
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
          'https://images.squarespace-cdn.com/content/v1/607f89e638219e13eee71b1e/1684821560422-SD5V37BAG28BURTLIXUQ/michael-sum-LEpfefQf4rU-unsplash.jpg',
        ]}
      />
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
    textAlign: 'left',
  },
  cardContent: {
    gap: space.md,
  },
});
