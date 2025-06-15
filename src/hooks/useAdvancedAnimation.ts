import { useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';

interface UseAdvancedAnimationOptions {
  duration?: number;
  easing?: any;
  delay?: number;
  useNativeDriver?: boolean;
}

export const useAdvancedAnimation = (initialValue = 0) => {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const animate = useCallback((
    toValue: number,
    options: UseAdvancedAnimationOptions = {}
  ) => {
    const {
      duration = 300,
      easing = Easing.bezier(0.4, 0, 0.2, 1),
      delay = 0,
      useNativeDriver = false,
    } = options;

    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    animationRef.current = Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      delay,
      useNativeDriver,
    });

    return new Promise<void>((resolve) => {
      animationRef.current!.start(({ finished }) => {
        if (finished) {
          resolve();
        }
      });
    });
  }, [animatedValue]);

  const spring = useCallback((
    toValue: number,
    config: Partial<Animated.SpringAnimationConfig> = {}
  ) => {
    const defaultConfig: Animated.SpringAnimationConfig = {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    };

    if (animationRef.current) {
      animationRef.current.stop();
    }

    animationRef.current = Animated.spring(animatedValue, {
      ...defaultConfig,
      ...config,
      toValue, // Ensure toValue is not overwritten
    });

    return new Promise<void>((resolve) => {
      animationRef.current!.start(({ finished }) => {
        if (finished) {
          resolve();
        }
      });
    });
  }, [animatedValue]);

  const sequence = useCallback((animations: Array<() => Promise<void>>) => {
    return animations.reduce(
      (promise, animation) => promise.then(animation),
      Promise.resolve()
    );
  }, []);

  const loop = useCallback((
    toValue: number,
    options: UseAdvancedAnimationOptions = {}
  ) => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
        ...options,
      })
    );

    animationRef.current = animation;
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const reset = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animatedValue.setValue(initialValue);
  }, [animatedValue, initialValue]);

  return {
    animatedValue,
    animate,
    spring,
    sequence,
    loop,
    reset,
  };
};

// Predefined animations
export const useScaleAnimation = (initialScale = 1) => {
  const { animatedValue, animate, spring } = useAdvancedAnimation(initialScale);

  const scaleIn = () => spring(1.05, { tension: 120, friction: 7, useNativeDriver: true });
  const scaleOut = () => spring(initialScale, { tension: 120, friction: 7, useNativeDriver: true });
  const press = () => spring(0.95, { tension: 120, friction: 7, useNativeDriver: true });

  return {
    scale: animatedValue,
    scaleIn,
    scaleOut,
    press,
  };
};

export const useFadeAnimation = (initialOpacity = 0) => {
  const { animatedValue, animate } = useAdvancedAnimation(initialOpacity);

  const fadeIn = (duration = 300) => animate(1, { duration });
  const fadeOut = (duration = 300) => animate(0, { duration });

  return {
    opacity: animatedValue,
    fadeIn,
    fadeOut,
  };
};

export const useSlideAnimation = (initialPosition = 0) => {
  const { animatedValue, animate, spring } = useAdvancedAnimation(initialPosition);

  const slideIn = (duration = 300) => 
    animate(0, { duration, easing: Easing.bezier(0.25, 0.8, 0.25, 1) });
  
  const slideOut = (toValue = 100, duration = 300) => 
    animate(toValue, { duration, easing: Easing.bezier(0.25, 0.8, 0.25, 1) });

  const slideSpring = (toValue = 0) => 
    spring(toValue, { tension: 100, friction: 8, useNativeDriver: true });

  return {
    translateY: animatedValue,
    translateX: animatedValue,
    slideIn,
    slideOut,
    slideSpring,
  };
};

// Stagger animation utility
export const useStaggerAnimation = (itemCount: number, staggerDelay = 50) => {
  const animations = useRef(
    Array.from({ length: itemCount }, () => new Animated.Value(0))
  ).current;

  const staggerIn = useCallback(() => {
    const staggeredAnimations = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * staggerDelay,
        easing: Easing.bezier(0.25, 0.8, 0.25, 1),
        useNativeDriver: true,
      })
    );

    Animated.parallel(staggeredAnimations).start();
  }, [animations, staggerDelay]);

  const staggerOut = useCallback(() => {
    const staggeredAnimations = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        delay: index * (staggerDelay / 2),
        easing: Easing.bezier(0.25, 0.8, 0.25, 1),
        useNativeDriver: true,
      })
    );

    Animated.parallel(staggeredAnimations).start();
  }, [animations, staggerDelay]);

  return {
    animations,
    staggerIn,
    staggerOut,
  };
};
