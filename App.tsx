import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import AppNavigator from './src/navigation/AppNavigator';
import { store } from './src/store';
import { checkAuthStatus } from './src/store/slices/authSlice';

export default function App() {
  useEffect(() => {
    // Check auth status on app start
    store.dispatch(checkAuthStatus());
  }, []);

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
}
