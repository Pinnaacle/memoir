import { useActiveGroup } from '@/hooks/useActiveGroup';
import { type UserGroup } from '@/services/groups';
import { baseColors } from '@/theme/colors';
import { space } from '@/theme/space';
import { text as textTheme } from '@/theme/type';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';

import { Select } from './ui/Select';
import { Text } from './ui/Text';

type GroupScopePickerProps = {
  color: string;
  label?: string;
  sheetTitle?: string;
  size?: 'compact' | 'default' | 'header';
  style?: ViewStyle;
};

function formatGroupLabel(group: UserGroup): string {
  if (group.groupKind === 'personal') {
    return 'Personal';
  }

  return group.name;
}

function formatGroupDescription(group: UserGroup): string {
  if (group.groupKind === 'personal') {
    return 'Private space for your own memories';
  }

  if (group.role === 'owner') {
    return 'Shared space you manage with others';
  }

  return 'Shared space with group content';
}

export function GroupScopePicker({
  color,
  label,
  sheetTitle,
  size = 'default',
  style,
}: GroupScopePickerProps) {
  const {
    activeGroupId,
    errorMessage,
    groups,
    isLoading,
    setActiveGroupId,
  } = useActiveGroup();

  if (isLoading) {
    return (
      <View
        style={[
          size === 'header' ? styles.loadingRowHeader : styles.loadingRow,
          style,
        ]}
      >
        <ActivityIndicator color={color} size="small" />
        {size === 'header' ? null : (
          <Text style={styles.loadingText}>Loading your spaces...</Text>
        )}
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.messageCard, style]}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={[styles.messageCard, style]}>
        <Text style={styles.emptyText}>No groups available yet.</Text>
      </View>
    );
  }

  return (
    <Select
      color={color}
      disabled={groups.length === 0}
      label={label}
      onChange={setActiveGroupId}
      options={groups.map((group) => ({
        label: formatGroupLabel(group),
        value: group.id,
        description: formatGroupDescription(group),
      }))}
      placeholder="Choose a space"
      sheetTitle={sheetTitle}
      size={size}
      style={style}
      value={activeGroupId ?? undefined}
    />
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  loadingRowHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderCurve: 'continuous',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 44,
    paddingHorizontal: space.md,
  },
  loadingText: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderCurve: 'continuous',
    borderRadius: 22,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  errorText: {
    color: baseColors.textError,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
  emptyText: {
    color: baseColors.textSoft,
    fontFamily: textTheme.family.medium,
    fontSize: textTheme.size.sm,
    lineHeight: textTheme.lineHeight.sm,
  },
});
