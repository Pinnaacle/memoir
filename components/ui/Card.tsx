import { Text } from '@/components/ui/Text';
import { baseColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { differenceInDays, parse } from 'date-fns';
import { Image } from 'expo-image';
import { Heart, House, MapPin, PlaneIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

interface CardProps extends React.ComponentProps<typeof View> {
  variant?: 'default' | 'compressed' | 'detailed';
  title: string;
  date: string;
  coverImage?: string | number;
  images?: string[];
  location?: string;
  description?: string;
  type?: string;
  icon?: 'heart' | 'plain' | 'house';
  color?: string;
}

function resolveImageSource(image?: string | number) {
  if (!image) {
    return undefined;
  }

  if (typeof image === 'string') {
    return { uri: image };
  }

  return image;
}

function Card(props: CardProps) {
  const variant = props.variant ?? 'default';

  switch (variant) {
    case 'compressed':
      return <CompressedCard {...props} />;
    case 'detailed':
      return <DetailedCard {...props} />;
    default:
      return <DefaultCard {...props} />;
  }
}

const DefaultCard = ({
  title,
  date,
  description,
  type,
  coverImage,
  color,
}: CardProps) => {
  const imageSource = resolveImageSource(coverImage);

  return (
    <View style={[styles.card]}>
      <View style={styles.imageContainerDefault}>
        <Image
          source={imageSource}
          style={{
            width: '100%',
            height: 140,
          }}
        />
        <View style={styles.overlay} />

        <View style={[styles.headerDefault, styles.header]}>
          <Text
            numberOfLines={1}
            role="heading"
            variant="h2"
            aria-level="3"
            style={[styles.title]}
          >
            {title}
          </Text>
          <Text style={[styles.date, { color: color }]}>{date}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.type]}>{type}</Text>
        <Text numberOfLines={2} style={[styles.description]}>
          {description}
        </Text>
      </View>
    </View>
  );
};

const CompressedCard = ({
  title,
  date,
  location,
  type,
  coverImage,
  color,
}: CardProps) => {
  const imageSource = resolveImageSource(coverImage);

  return (
    <View style={[styles.cardCompressed, styles.card]}>
      <View style={styles.imageContainerCompressed}>
        <Image
          source={imageSource}
          style={{
            width: '100%',
            height: 140,
          }}
        />
        <View style={styles.overlay} />
      </View>
      <View style={[styles.headerCompressed, styles.header]}>
        <Text
          numberOfLines={1}
          role="heading"
          variant="h2"
          aria-level="3"
          style={[styles.title]}
        >
          {title}
        </Text>
        <Text style={[styles.date, { color: color }]}>{date}</Text>
        <Text style={[styles.type]}>{type}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MapPin color={baseColors.textSoft} size={textTheme.size.xs} />
          <Text style={[styles.location]}>{location}</Text>
        </View>
      </View>
    </View>
  );
};

const DetailedCard = ({
  title,
  date,
  description,
  images,
  icon,
  color,
}: CardProps) => {
  const d2 = parse(date, 'MMMM d, yyyy', new Date());
  const days = differenceInDays(new Date(), d2);

  return (
    <View style={[styles.cardDetailed, styles.card]}>
      <View
        style={[
          {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
          },
        ]}
      >
        {icon === 'heart' && (
          <Heart
            color={baseColors.text}
            size={24}
            style={[{ paddingHorizontal: space.lg }]}
          />
        )}
        {icon === 'plain' && (
          <PlaneIcon
            color={baseColors.text}
            size={24}
            style={[{ paddingHorizontal: space.lg }]}
          />
        )}
        {icon === 'house' && (
          <House
            color={baseColors.text}
            size={24}
            style={[{ paddingHorizontal: space.lg }]}
          />
        )}

        <View style={styles.header}>
          <Text
            numberOfLines={1}
            role="heading"
            variant="h2"
            aria-level="3"
            style={[styles.title]}
          >
            {title}
          </Text>
          <Text style={[styles.date, { color: color }]}>
            {days === null ? date : `${date} • ${days} days ago`}
          </Text>
        </View>
      </View>

      <Text numberOfLines={2} style={[styles.description]}>
        {description}
      </Text>
      <View style={styles.imageContainerDetailed}>
        {images?.slice(0, 4).map((img, index) => (
          <Image
            key={index}
            source={{ uri: img }}
            style={{
              width: '22.5%',
              aspectRatio: 1 / 1,
              objectFit: 'cover',
              borderRadius: radius.lg,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: baseColors.card,
    borderRadius: radius.xl,
    shadowColor: baseColors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 2,
  },
  cardDetailed: {
    gap: space.lg,
    padding: space.lg,
  },
  cardCompressed: {
    gap: space.sm,
  },

  imageContainerDetailed: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  imageContainerCompressed: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainerDefault: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },

  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  header: {
    gap: space.xxs,
    paddingHorizontal: space.md,
  },
  headerCompressed: {
    position: 'absolute',
    bottom: space.xl,
    left: space.md,
  },
  headerDefault: {
    position: 'absolute',
    bottom: space.xl,
    left: space.md,
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

  content: {
    padding: space.xl,
    gap: space.md,
  },
  type: {
    color: baseColors.textSoft,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    fontFamily: textTheme.family.semiBold,
  },
  description: {
    color: baseColors.textSoft,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
    fontFamily: textTheme.family.regular,
  },

  location: {
    fontSize: textTheme.size.xs,
    lineHeight: textTheme.lineHeight.xs,
    fontFamily: textTheme.family.regular,
    color: baseColors.textSoft,
  },
});

export { Card };
