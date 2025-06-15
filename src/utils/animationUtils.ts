import { Platform } from 'react-native';

/**
 * Utility to conditionally use native driver based on platform
 * React Native Web doesn't support useNativeDriver for most animations
 */
export const shouldUseNativeDriver = (forTransforms = true): boolean => {
  // For web, only use native driver for transform animations
  if (Platform.OS === 'web') {
    return forTransforms;
  }
  
  // For native platforms, use native driver by default
  return true;
};

/**
 * Get the appropriate animation config for the current platform
 */
export const getAnimationConfig = (
  config: any,
  forTransforms = true
): any => {
  return {
    ...config,
    useNativeDriver: shouldUseNativeDriver(forTransforms),
  };
};

/**
 * Platform-specific shadow styles
 */
export const getPlatformShadow = (shadowStyle: any) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: shadowStyle.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.1)',
    };
  }
  
  return {
    shadowColor: shadowStyle.shadowColor || '#000',
    shadowOffset: shadowStyle.shadowOffset || { width: 0, height: 2 },
    shadowOpacity: shadowStyle.shadowOpacity || 0.1,
    shadowRadius: shadowStyle.shadowRadius || 4,
    elevation: shadowStyle.elevation || 4,
  };
};
