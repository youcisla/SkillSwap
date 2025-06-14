import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { Provider as ReduxProvider } from 'react-redux';

// Enable native screens for better performance
enableScreens();

import EnhancedErrorBoundary from './src/components/common/EnhancedErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import { analyticsService } from './src/services/analyticsService';
import { notificationService } from './src/services/notificationService';
import { store } from './src/store';
import { ThemeProvider } from './src/theme/ThemeProvider';

// Initialize analytics when app starts
const initializeServices = async () => {
  try {
    // Analytics is auto-initialized in constructor
    analyticsService.trackEvent('app_start', {
      timestamp: new Date().toISOString(),
      platform: 'react-native'
    });
    console.log('📊 Analytics initialized successfully');

    // Initialize notifications
    await notificationService.initialize();
    console.log('📱 Notifications initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    analyticsService.trackError(error as Error, {
      context: 'app_initialization',
      critical: true
    });
  }
};

// App Content with Error Boundary
const AppContent: React.FC = () => {
  useEffect(() => {
    initializeServices();

    // Track app session start
    const sessionStart = Date.now();
    analyticsService.trackEvent('session_start', {
      timestamp: new Date().toISOString()
    });

    // Cleanup on unmount
    return () => {
      const sessionDuration = Date.now() - sessionStart;
      analyticsService.trackEvent('session_end', {
        duration: sessionDuration,
        timestamp: new Date().toISOString()
      });
      analyticsService.flush();
    };
  }, []);

  return (
    <EnhancedErrorBoundary 
      level="app" 
      context="main_app"
      onError={(error, errorInfo) => {
        console.error('🚨 App-level error caught:', error);
        analyticsService.trackError(error, {
          context: 'app_level_crash',
          component_stack: errorInfo.componentStack,
          critical: true
        });
      }}
    >
      <ThemeProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </EnhancedErrorBoundary>
  );
};

export default function App() {
  return (
    <EnhancedErrorBoundary 
      level="app" 
      context="root_provider"
      onError={(error, errorInfo) => {
        console.error('🚨 Root-level error caught:', error);
        // Log to external service immediately since analytics might not be available
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ReduxProvider store={store}>
            <PaperProvider>
              <AppContent />
            </PaperProvider>
          </ReduxProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </EnhancedErrorBoundary>
  );
}
