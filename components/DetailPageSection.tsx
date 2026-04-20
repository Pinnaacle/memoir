import { baseColors, sectionColors } from '@/theme/colors';
import { text as textTheme } from '@/theme/type';
import { differenceInDays, parse } from 'date-fns';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Divider from './ui/Divider';
import Image from './ui/Image';
import { Text } from './ui/Text';

const ITEM_WIDTH = 110;
const COLUMNS = 3;

interface DetailPageSectionProps {
  title: string;
  date: string;
  description: string;
  location?: string;
  type?: string;
  images: string[];
  color: string;
}

export default function DetailPageSection({
  title,
  date,
  description,
  images,
  color,
  location,
}: DetailPageSectionProps) {
  let descriptionTitle;
  if (color === sectionColors.moments) {
    descriptionTitle = 'Memory';
  } else if (color === sectionColors.events) {
    descriptionTitle = 'Event';
  } else {
    descriptionTitle = 'Story';
  }

  const d2 = parse(date, 'MMMM d, yyyy', new Date());
  const days = differenceInDays(new Date(), d2);

  const { width } = useWindowDimensions();
  const horizontalPadding = 16 * 2; // same as your container paddingHorizontal
  const availableWidth = width - horizontalPadding;
  const gap = (availableWidth - ITEM_WIDTH * COLUMNS) / (COLUMNS - 1);

  return (
    <View style={styles.DetailPage}>
      <View style={styles.DetailPageSection}>
        <Text role="heading" variant="h2" aria-level="3" style={[styles.title]}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Calendar color={color} size={textTheme.size.xs} />
          <Text style={[styles.date, { color: color }]}>{date}</Text>
        </View>
        {location && color === sectionColors.events && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin color={baseColors.textSoft} size={textTheme.size.xs} />
            <Text style={[styles.location]}>{location}</Text>
          </View>
        )}
        {color === sectionColors.chapters && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock color={baseColors.textSoft} size={textTheme.size.xs} />
            <Text style={[styles.location]}>{`${days} days ago`}</Text>
          </View>
        )}
      </View>

      <Divider color={color} />

      <View style={styles.DetailPageSection}>
        <Text style={[styles.sectionTitle]} role="heading" aria-level={2}>
          {descriptionTitle}
        </Text>
        <Text style={[styles.description]}>{description}</Text>
      </View>

      <Divider color={color} />

      <View style={styles.DetailPageSection}>
        <Text style={[styles.sectionTitle]} role="heading" aria-level={2}>
          Photos
        </Text>
        <View
          style={{
            display: 'flex',
            flex: 3,
            gap: gap,
            marginHorizontal: 'auto',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {images.map((image, index) => (
            <Image key={index} source={image} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  DetailPage: {
    backgroundColor: baseColors.bg,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  DetailPageSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  title: {
    fontFamily: textTheme.family.semiBold,
    lineHeight: textTheme.lineHeight.xl,
    fontSize: textTheme.size.xl,
  },
  date: {
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
    fontFamily: textTheme.family.mediumItalic,
  },
  location: {
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
    fontFamily: textTheme.family.regular,
    color: baseColors.textSoft,
  },
  sectionTitle: {
    fontFamily: textTheme.family.semiBold,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    color: baseColors.textSoft,
    textTransform: 'uppercase',
  },
  description: {
    color: baseColors.text,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    fontFamily: textTheme.family.regular,
  },
});
