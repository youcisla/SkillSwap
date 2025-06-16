import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { getAnimationConfig } from '../utils/animationUtils';

export interface AnimationConfig {
  duration?: number;
  easing?: typeof Easing.linear;
  useNativeDriver?: boolean;
  delay?: number;
}

// Enhanced animation hook for better performance and reusability
export const useAnimation = () => {
  const createAnimatedValue = useCallback((initialValue = 0) => {
    return new Animated.Value(initialValue);
  }, []);

  const animateTo = useCallback((
    animatedValue: Animated.Value,
    toValue: number,
    config: AnimationConfig = {}
  ) => {
    const animationConfig = getAnimationConfig({
      duration: 300,
      easing: Easing.out(Easing.quad),
      delay: 0,
      ...config,
      toValue,
    }, false); // false for non-transform animations

    const animation = Animated.timing(animatedValue, animationConfig);

    return {
      start: (callback?: () => void) => animation.start(callback),
      stop: () => animation.stop(),
      reset: () => animation.reset(),
    };
  }, []);

  const createSpringAnimation = useCallback((
    animatedValue: Animated.Value,
    toValue: number,
    config?: {
      tension?: number;
      friction?: number;
      useNativeDriver?: boolean;
    }
  ) => {
    const springConfig = getAnimationConfig({
      tension: 100,
      friction: 8,
      ...config,
      toValue,
    }, true); // true for transform animations

    return Animated.spring(animatedValue, springConfig);
  }, []);

  const createSequence = useCallback((animations: Animated.CompositeAnimation[]) => {
    return Animated.sequence(animations);
  }, []);

  const createParallel = useCallback((animations: Animated.CompositeAnimation[]) => {
    return Animated.parallel(animations);
  }, []);

  const createLoop = useCallback((
    animation: Animated.CompositeAnimation,
    iterations = -1
  ) => {
    return Animated.loop(animation, { iterations });
  }, []);

  return {
    createAnimatedValue,
    animateTo,
    createSpringAnimation,
    createSequence,
    createParallel,
    createLoop,
  };
};

// Hook for fade in/out animations
export const useFadeAnimation = (duration = 300) => {
  const opacity = useRef(new Animated.Value(0)).current;

  const fadeIn = useCallback((callback?: () => void) => {
    const config = getAnimationConfig({
      toValue: 1,
      duration,
    }, false);
    
    Animated.timing(opacity, config).start(callback);
  }, [opacity, duration]);

  const fadeOut = useCallback((callback?: () => void) => {
    const config = getAnimationConfig({
      toValue: 0,
      duration,
    }, false);
    
    Animated.timing(opacity, config).start(callback);
  }, [opacity, duration]);

  const fadeToggle = useCallback((visible: boolean, callback?: () => void) => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start(callback);
  }, [opacity, duration]);

  return { opacity, fadeIn, fadeOut, fadeToggle };
};

// Hook for scale animations
export const useScaleAnimation = (duration = 200) => {
  const scale = useRef(new Animated.Value(1)).current;

  const scaleIn = useCallback((callback?: () => void) => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start(callback);
  }, [scale]);

  const scaleOut = useCallback((callback?: () => void) => {
    Animated.spring(scale, {
      toValue: 0,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start(callback);
  }, [scale]);

  const scalePulse = useCallback((callback?: () => void) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.1,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]).start(callback);
  }, [scale, duration]);

  const scalePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  return { scale, scaleIn, scaleOut, scalePulse, scalePress };
};

// Hook for slide animations
export const useSlideAnimation = (duration = 300) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const slideInFromLeft = useCallback((callback?: () => void) => {
    translateX.setValue(-300);
    Animated.timing(translateX, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(callback);
  }, [translateX, duration]);

  const slideInFromRight = useCallback((callback?: () => void) => {
    translateX.setValue(300);
    Animated.timing(translateX, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(callback);
  }, [translateX, duration]);

  const slideInFromTop = useCallback((callback?: () => void) => {
    translateY.setValue(-300);
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(callback);
  }, [translateY, duration]);

  const slideInFromBottom = useCallback((callback?: () => void) => {
    translateY.setValue(300);
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(callback);
  }, [translateY, duration]);

  const slideOutToLeft = useCallback((callback?: () => void) => {
    Animated.timing(translateX, {
      toValue: -300,
      duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(callback);
  }, [translateX, duration]);

  const slideOutToRight = useCallback((callback?: () => void) => {
    Animated.timing(translateX, {
      toValue: 300,
      duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(callback);
  }, [translateX, duration]);

  return {
    translateX,
    translateY,
    slideInFromLeft,
    slideInFromRight,
    slideInFromTop,
    slideInFromBottom,
    slideOutToLeft,
    slideOutToRight,
  };
};

// Hook for entrance animations
export const useEntranceAnimation = (delay = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  const playEntrance = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
    ]).start(callback);
  }, [opacity, translateY, scale, delay]);

  useEffect(() => {
    playEntrance();
  }, [playEntrance]);

  return {
    opacity,
    translateY,
    scale,
    playEntrance,
  };
};

export default useAnimation;
