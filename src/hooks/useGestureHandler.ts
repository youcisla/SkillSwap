import { useCallback, useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

interface UseGestureHandlerOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressThreshold?: number;
}

export const useGestureHandler = (options: UseGestureHandlerOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    swipeThreshold = 50,
    longPressThreshold = 500,
  } = options;

  const gestureStartTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        gestureStartTime.current = Date.now();
        
        if (onLongPress) {
          longPressTimer.current = setTimeout(() => {
            onLongPress();
          }, longPressThreshold);
        }
      },
      onPanResponderMove: () => {
        // Clear long press if finger moves
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Clear long press timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Determine swipe direction
        if (absDx > swipeThreshold && absDx > absDy) {
          if (dx > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        } else if (absDy > swipeThreshold && absDy > absDx) {
          if (dy > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      },
    });
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onLongPress, swipeThreshold, longPressThreshold]);

  return { panHandlers: panResponder.panHandlers };
};

// Hook for enhanced pull-to-refresh
export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const refreshing = useRef(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const handleRefresh = useCallback(async () => {
    if (refreshing.current) return;
    
    refreshing.current = true;
    
    // Animate pull indicator
    Animated.timing(translateY, {
      toValue: 50,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      await onRefresh();
    } finally {
      // Reset animation
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        refreshing.current = false;
      });
    }
  }, [onRefresh, translateY]);

  return {
    refreshing: refreshing.current,
    translateY,
    onRefresh: handleRefresh,
  };
};

// Hook for optimized scroll performance
export const useOptimizedScroll = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const isScrolling = useRef(false);

  const onScroll = useMemo(() => 
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { 
        useNativeDriver: false,
        listener: () => {
          if (!isScrolling.current) {
            isScrolling.current = true;
            // Debounce scroll end
            setTimeout(() => {
              isScrolling.current = false;
            }, 100);
          }
        }
      }
    ),
    [scrollY]
  );

  return {
    scrollY,
    onScroll,
    isScrolling: isScrolling.current,
  };
};

export default useGestureHandler;
