import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import {
    Text,
    useTheme
} from 'react-native-paper';
import { borderRadius, colors, shadows, spacing } from '../../theme';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'gradient';
export type CardSize = 'small' | 'medium' | 'large';

interface EnhancedCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  gradientColors?: readonly [string, string, ...string[]];
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  animationEnabled?: boolean;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  variant = 'elevated',
  size = 'medium',
  onPress,
  onLongPress,
  disabled = false,
  style,
  contentStyle,
  gradientColors,
  accessibilityLabel,
  accessibilityHint,
  testID,
  animationEnabled = true,
}) => {
  const theme = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animationEnabled && (onPress || onLongPress)) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: false,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animationEnabled && (onPress || onLongPress)) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: false,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    };

    // Size styles
    const sizeStyles: Record<CardSize, ViewStyle> = {
      small: {
        padding: spacing.sm,
      },
      medium: {
        padding: spacing.md,
      },
      large: {
        padding: spacing.lg,
      },
    };

    // Variant styles
    const variantStyles: Record<CardVariant, ViewStyle> = {
      elevated: {
        backgroundColor: theme.colors.surface,
        ...shadows.md,
      },
      outlined: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.outline,
      },
      filled: {
        backgroundColor: theme.colors.surfaceVariant,
      },
      gradient: {
        backgroundColor: 'transparent',
        ...shadows.md,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.6 }),
    };
  };

  const cardContent = (
    <View style={[getCardStyles(), contentStyle]}>
      {children}
    </View>
  );

  if (variant === 'gradient') {
    const CardWrapper = onPress || onLongPress ? Pressable : View;
    const wrapperProps = onPress || onLongPress ? {
      onPress,
      onLongPress,
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
      disabled,
      accessibilityRole: 'button' as const,
      accessibilityLabel,
      accessibilityHint,
      testID,
    } : { testID };

    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <CardWrapper {...wrapperProps}>
          <LinearGradient
            colors={gradientColors || colors.gradient.primary}
            style={[getCardStyles(), { padding: 0 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[{ padding: getCardStyles().padding }, contentStyle]}>
              {children}
            </View>
          </LinearGradient>
        </CardWrapper>
      </Animated.View>
    );
  }

  if (onPress || onLongPress) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          testID={testID}
          style={({ pressed }) => [
            getCardStyles(),
            pressed && animationEnabled && styles.pressed,
          ]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[getCardStyles(), style]} testID={testID}>
      {children}
    </View>
  );
};

// Specialized card components
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  style?: ViewStyle;
  onPress?: () => void;
}> = ({ title, value, icon, trend, style, onPress }) => {
  const theme = useTheme();

  return (
    <EnhancedCard
      variant="elevated"
      size="medium"
      onPress={onPress}
      style={StyleSheet.flatten([styles.statCard, style])}
    >
      <View style={styles.statHeader}>
        {icon && <View style={styles.statIcon}>{icon}</View>}
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {value}
          </Text>
          <Text style={[styles.statTitle, { color: theme.colors.onSurfaceVariant }]}>
            {title}
          </Text>
          {trend && (
            <Text
              style={[
                styles.statTrend,
                { color: trend.isPositive ? colors.success.main : colors.error.main },
              ]}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Text>
          )}
        </View>
      </View>
    </EnhancedCard>
  );
};

export const ActionCard: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}> = ({ title, description, icon, action, style, onPress }) => {
  const theme = useTheme();

  return (
    <EnhancedCard
      variant="elevated"
      size="medium"
      onPress={onPress}
      style={style}
    >
      <View style={styles.actionCardContent}>
        {icon && <View style={styles.actionIcon}>{icon}</View>}
        <View style={styles.actionText}>
          <Text style={[styles.actionTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.actionDescription, { color: theme.colors.onSurfaceVariant }]}>
              {description}
            </Text>
          )}
        </View>
        {action && <View style={styles.actionButton}>{action}</View>}
      </View>
    </EnhancedCard>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.95,
  },
  statCard: {
    minHeight: 100,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  statTrend: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: spacing.md,
  },
});

export default EnhancedCard;
