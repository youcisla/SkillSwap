import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Animated,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import {
    ActivityIndicator,
    Text,
    useTheme,
} from 'react-native-paper';
import { spacing, typography } from '../../theme';

export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'spinner' | 'skeleton' | 'pulse' | 'shimmer';

interface LoadingStateProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  style?: ViewStyle;
  color?: string;
  testID?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'medium',
  variant = 'spinner',
  text,
  fullScreen = false,
  overlay = false,
  style,
  color,
  testID,
}) => {
  const theme = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;
  const shimmerAnim = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    if (variant === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (variant === 'shimmer') {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [variant, pulseAnim, shimmerAnim]);

  const getSizeStyles = () => {
    const sizes = {
      small: 20,
      medium: 32,
      large: 48,
    };
    return sizes[size];
  };

  const renderSpinner = () => (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator
        size={getSizeStyles()}
        color={color || theme.colors.primary}
        testID={testID}
      />
      {text && (
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          {text}
        </Text>
      )}
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonBox, { backgroundColor: theme.colors.surfaceVariant }]} />
      <View style={[styles.skeletonLine, { backgroundColor: theme.colors.surfaceVariant }]} />
      <View style={[styles.skeletonLineShort, { backgroundColor: theme.colors.surfaceVariant }]} />
    </View>
  );

  const renderPulse = () => (
    <Animated.View style={[styles.pulseContainer, { opacity: pulseAnim }]}>
      <View style={[styles.pulseBox, { backgroundColor: theme.colors.primary }]} />
      {text && (
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          {text}
        </Text>
      )}
    </Animated.View>
  );

  const renderShimmer = () => {
    const translateX = shimmerAnim.interpolate({
      inputRange: [-1, 1],
      outputRange: [-300, 300],
    });

    return (
      <View style={styles.shimmerContainer}>
        <View style={[styles.shimmerBox, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255, 255, 255, 0.4)',
                'transparent',
              ]}
              style={styles.shimmerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
        {text && (
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {text}
          </Text>
        )}
      </View>
    );
  };

  const renderLoading = () => {
    switch (variant) {
      case 'skeleton':
        return renderSkeleton();
      case 'pulse':
        return renderPulse();
      case 'shimmer':
        return renderShimmer();
      default:
        return renderSpinner();
    }
  };

  const containerStyle = [
    fullScreen && styles.fullScreen,
    overlay && styles.overlay,
    style,
  ];

  return (
    <View style={containerStyle}>
      {renderLoading()}
    </View>
  );
};

// Enhanced Skeleton Components for better UX
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const theme = useTheme();
  const shimmerAnim = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[styles.enhancedSkeletonCard, style]}>
      <View style={styles.skeletonOverlay}>
        <Animated.View
          style={[
            styles.shimmerEffect,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonAvatar, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={styles.skeletonText}>
          <View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: theme.colors.surfaceVariant }]} />
          <View style={[styles.skeletonLine, styles.skeletonSubtitle, { backgroundColor: theme.colors.surfaceVariant }]} />
        </View>
      </View>
      
      <View style={styles.skeletonActions}>
        <View style={[styles.skeletonButton, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={[styles.skeletonButton, { backgroundColor: theme.colors.surfaceVariant }]} />
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number; style?: ViewStyle }> = ({ 
  count = 3, 
  style 
}) => (
  <View style={style}>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={index} style={{ marginBottom: spacing.md }} />
    ))}
  </View>
);

// Enhanced Empty State Component
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
}> = ({ title, description, icon, action, style }) => {
  const theme = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }, style]}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
      )}
      {action && <View style={styles.emptyAction}>{action}</View>}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body2,
    textAlign: 'center',
  },
  skeletonContainer: {
    padding: spacing.md,
  },
  skeletonBox: {
    height: 60,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  skeletonLineShort: {
    height: 16,
    width: '70%',
    borderRadius: 4,
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pulseBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  shimmerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  shimmerBox: {
    width: 200,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
  },
  enhancedSkeletonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 12,
  },
  shimmerEffect: {
    width: '30%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    opacity: 0.5,
  },
  skeletonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  skeletonText: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  skeletonSubtitle: {
    height: 12,
    width: '70%',
    borderRadius: 6,
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonButton: {
    height: 36,
    width: '45%',
    borderRadius: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h5,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyAction: {
    marginTop: spacing.md,
  },
});

export default LoadingState;
