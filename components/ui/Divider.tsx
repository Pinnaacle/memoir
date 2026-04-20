import { StyleSheet, View } from 'react-native';

interface DividerProps extends React.ComponentProps<typeof View> {
  color: string;
}

export default function Divider({ color }: DividerProps) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.125,
  },
});
