import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Keyboard } from 'react-native';

interface UseKeyboardOptions {
  useKeyboardHeight?: boolean;
  animationDuration?: number;
}

export const useKeyboard = (options: UseKeyboardOptions = {}) => {
  const { useKeyboardHeight = true, animationDuration = 250 } = options;
  
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const keyboardAnimatedValue = useRef(new Animated.Value(0)).current;

  const animateKeyboard = useCallback((toValue: number) => {
    Animated.timing(keyboardAnimatedValue, {
      toValue,
      duration: animationDuration,
      useNativeDriver: false,
    }).start();
  }, [keyboardAnimatedValue, animationDuration]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      (e) => {
        const height = useKeyboardHeight ? e.endCoordinates.height : 1;
        setKeyboardHeight(height);
        setIsKeyboardVisible(true);
        animateKeyboard(height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        animateKeyboard(0);
      }
    );

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        const height = useKeyboardHeight ? e.endCoordinates.height : 1;
        setKeyboardHeight(height);
        setIsKeyboardVisible(true);
        animateKeyboard(height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        animateKeyboard(0);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [animateKeyboard, useKeyboardHeight]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    keyboardAnimatedValue,
    dismissKeyboard,
  };
};

export default useKeyboard;
