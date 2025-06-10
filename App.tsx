import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { checkAuthStatus } from './src/store/slices/authSlice';

// Import test app for debugging
import TestApp from './TestApp';

export default function App() {
  useEffect(() => {
    // Check auth status on app start
    store.dispatch(checkAuthStatus());
  }, []);

  // Temporarily use TestApp to see if React Native is working
  // Comment out this return and uncomment the main app return below once we confirm UI is working
  return (
    <SafeAreaProvider>
      <TestApp />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );

  // Main app (commented out for testing)
  /*
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PaperProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </PaperProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
  */
}
