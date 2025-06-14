import React from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import {
    Checkbox,
    IconButton,
    Text,
    useTheme
} from 'react-native-paper';
import { borderRadius, colors, spacing } from '../../theme';

// Selection Header Component
interface SelectionHeaderProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCancel?: () => void;
  isAllSelected: boolean;
  style?: ViewStyle;
}

export const SelectionHeader: React.FC<SelectionHeaderProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onCancel,
  isAllSelected,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.selectionHeader, { backgroundColor: theme.colors.primaryContainer }, style]}>
      <View style={styles.selectionInfo}>
        <Checkbox
          status={selectedCount === 0 ? 'unchecked' : isAllSelected ? 'checked' : 'indeterminate'}
          onPress={isAllSelected ? onDeselectAll : onSelectAll}
        />
        <Text style={styles.selectionText}>
          {selectedCount > 0 ? `${selectedCount} of ${totalCount} selected` : 'Select items'}
        </Text>
      </View>
      {onCancel && (
        <IconButton
          icon="close"
          size={24}
          onPress={onCancel}
          iconColor={theme.colors.onPrimaryContainer}
        />
      )}
    </View>
  );
};

// Selectable Item Component
interface SelectableItemProps {
  children: React.ReactNode;
  isSelected: boolean;
  onToggleSelection: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  showCheckbox?: boolean;
}

export const SelectableItem: React.FC<SelectableItemProps> = ({
  children,
  isSelected,
  onToggleSelection,
  onPress,
  onLongPress,
  disabled = false,
  style,
  showCheckbox = true,
}) => {
  const theme = useTheme();

  const handlePress = () => {
    if (disabled) return;
    if (onPress) {
      onPress();
    } else {
      onToggleSelection();
    }
  };

  const handleLongPress = () => {
    if (disabled) return;
    if (onLongPress) {
      onLongPress();
    } else {
      onToggleSelection();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      style={[
        styles.selectableItem,
        {
          backgroundColor: isSelected 
            ? theme.colors.primaryContainer + '40'
            : theme.colors.surface,
          borderColor: isSelected 
            ? theme.colors.primary
            : theme.colors.outline,
        },
        disabled && styles.disabledItem,
        style,
      ]}
    >
      {showCheckbox && (
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={onToggleSelection}
            disabled={disabled}
          />
        </View>
      )}
      <View style={[styles.itemContent, !showCheckbox && styles.itemContentNoCheckbox]}>
        {children}
      </View>
    </Pressable>
  );
};

// Bulk Actions Bar
interface BulkAction {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface BulkActionsBarProps {
  actions: BulkAction[];
  selectedCount: number;
  style?: ViewStyle;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  actions,
  selectedCount,
  style,
}) => {
  const theme = useTheme();

  if (selectedCount === 0) return null;

  return (
    <View style={[styles.bulkActionsBar, { backgroundColor: theme.colors.surface }, style]}>
      <Text style={[styles.bulkActionsTitle, { color: theme.colors.onSurface }]}>
        {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
      </Text>
      <View style={styles.bulkActionsButtons}>
        {actions.map((action) => (
          <IconButton
            key={action.id}
            icon={action.icon}
            size={24}
            onPress={action.onPress}
            disabled={action.disabled}
            iconColor={action.destructive ? theme.colors.error : theme.colors.primary}
            style={styles.bulkActionButton}
          />
        ))}
      </View>
    </View>
  );
};

// Selection Info Badge
interface SelectionBadgeProps {
  count: number;
  style?: ViewStyle;
}

export const SelectionBadge: React.FC<SelectionBadgeProps> = ({ count, style }) => {
  const theme = useTheme();

  if (count === 0) return null;

  return (
    <View style={[styles.selectionBadge, { backgroundColor: theme.colors.primary }, style]}>
      <Text style={[styles.selectionBadgeText, { color: theme.colors.onPrimary }]}>
        {count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    elevation: 2,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionText: {
    marginLeft: spacing.sm,
    fontSize: 16,
    fontWeight: '500',
  },
  selectableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.neutral[50],
  },
  disabledItem: {
    opacity: 0.5,
  },
  checkboxContainer: {
    paddingLeft: spacing.sm,
  },
  itemContent: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  itemContentNoCheckbox: {
    paddingLeft: spacing.md,
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    elevation: 4,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  bulkActionsTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
  },
  bulkActionButton: {
    marginLeft: spacing.xs,
  },
  selectionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
