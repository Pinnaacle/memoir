import { baseColors } from '@/theme/colors';
import { text } from '@/theme/type';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Chip from './Chip';
import { Text } from './Text';

interface ImageProps {
  source: string;
  variant?: 'default' | 'large' | 'polaroid';
  chip?: {
    label: string;
    color: string;
  };
  polaroid?: {
    color: string;
    date: string;
  };
}

export default function Image({
  source,
  variant = 'default',
  chip,
  polaroid,
}: ImageProps) {
  const imageVariant = variant;

  switch (imageVariant) {
    case 'large':
      return <LargeImage source={source} chip={chip} />;
    case 'polaroid':
      return <PolaroidImage source={source} polaroid={polaroid} />;
    default:
      return <DefaultImage source={source} />;
  }
}

function DefaultImage({ source }: ImageProps) {
  return (
    <ExpoImage source={{ uri: source }} style={styles.imageContainerDefault} />
  );
}

function LargeImage({ source, chip }: ImageProps) {
  return (
    <View style={styles.imageContainerLarge}>
      <ExpoImage source={{ uri: source }} style={styles.imageLarge} />
      <Chip
        style={styles.chip}
        isSelected
        label={chip?.label || ''}
        color={chip?.color || ''}
      />
    </View>
  );
}

function PolaroidImage({ source, polaroid }: ImageProps) {
  let randomRotation = Math.random() * 10 - 5; // Random rotation between -5 and 5 degrees
  let pinOffset = 175 / 2 - 8; // Center the pin based on the image width and pin size
  return (
    <View
      style={[
        styles.polaroidContainer,
        {
          transform: [{ rotate: `${randomRotation}deg` }],
        },
      ]}
    >
      <ExpoImage source={{ uri: source }} style={styles.imagePolaroid} />
      <View
        style={[
          styles.pin,
          { backgroundColor: polaroid?.color, left: pinOffset },
        ]}
      ></View>
      <Text style={styles.text}>{polaroid?.date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainerDefault: {
    width: 110,
    height: 110,
    objectFit: 'cover',
    borderRadius: 14,
  },

  imageContainerLarge: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  imageLarge: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  chip: {
    position: 'absolute',
    bottom: 24,
    left: 16,
  },

  polaroidContainer: {
    width: 175,
    height: 200,
    // transform: [{ rotate: '-5deg' }],
    backgroundColor: baseColors.text,
    padding: 12.5,
    paddingBottom: 100,
    position: 'relative',
    borderRadius: 4,
  },
  imagePolaroid: {
    width: 150,
    height: 150,
    objectFit: 'cover',
    borderRadius: 2,
  },
  text: {
    color: baseColors.textMuted,
    fontFamily: text.family.regularItalic,
    fontSize: text.size.xs,
    textAlign: 'center',
    paddingBottom: 4,
    lineHeight: text.lineHeight.xs,
  },
  pin: {
    width: 16,
    height: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    position: 'absolute',
    top: -8,
    marginHorizontal: 'auto',
    boxShadow: `0 2px 4px 0 ${baseColors.shadow}`,
  },
});
