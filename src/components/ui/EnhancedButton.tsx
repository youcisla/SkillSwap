import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import {
  ActivityIndicator,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { animations, borderRadius, colors, shadows, spacing } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface EnhancedButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode | string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: readonly [string, string, ...string[]];
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  hapticFeedback?: boolean;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  gradientColors,
  accessibilityLabel,
  accessibilityHint,
  testID,
  hapticFeedback = true,
}) => {
  const theme = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: animations.scale.press,
        duration: animations.timing.fast,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: animations.timing.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animations.timing.fast,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: animations.timing.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      ...shadows.sm,
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 48,
      },
      large: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      gradient: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: colors.error.main,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      ...(disabled && { opacity: 0.6 }),
    };
  };

  const getTextStyles = (): TextStyle => {
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      small: {
        fontSize: 14,
        fontWeight: '500',
      },
      medium: {
        fontSize: 16,
        fontWeight: '600',
      },
      large: {
        fontSize: 18,
        fontWeight: '600',
      },
    };

    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: 'white',
      },
      secondary: {
        color: 'white',
      },
      outline: {
        color: theme.colors.primary,
      },
      ghost: {
        color: theme.colors.primary,
      },
      gradient: {
        color: 'white',
      },
      danger: {
        color: 'white',
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getIconColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return 'white';
    }
  };

  const renderIcon = (iconProp: React.ReactNode | string) => {
    if (typeof iconProp === 'string') {
      const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
      return (
        <IconButton 
          icon={iconProp} 
          size={iconSize} 
          iconColor={getIconColor()}
          style={{ margin: 0 }}
        />
      );
    }
    return iconProp;
  };

  const buttonContent = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size={size === 'small' ? 16 : 20}
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : 'white'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={[styles.icon, { marginRight: spacing.sm }]}>
              {renderIcon(icon)}
            </View>
          )}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={[styles.icon, { marginLeft: spacing.sm }]}>
              {renderIcon(icon)}
            </View>
          )}
        </>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View style={[
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        style
      ]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
          testID={testID}
          style={({ pressed }) => [
            getButtonStyles(),
            pressed && { opacity: 0.9 },
          ]}
        >
          <LinearGradient
            colors={gradientColors || colors.gradient.primary}
            style={[styles.gradient, getButtonStyles()]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {buttonContent}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      style
    ]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        testID={testID}
        style={({ pressed }) => [
          getButtonStyles(),
          pressed && { opacity: 0.9 },
        ]}
      >
        {buttonContent}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    borderRadius: borderRadius.md,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default EnhancedButton;
