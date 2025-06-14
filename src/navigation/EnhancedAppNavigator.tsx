import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import EnhancedErrorBoundary from '../components/common/EnhancedErrorBoundary';
import { analyticsService } from '../services/analyticsService';
import { useAppDispatch, useAppSelector } from '../store';
import { checkAuthStatus } from '../store/slices/authSlice';
import { RootStackParamList } from '../types';

// Import screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ContentModerationScreen from '../screens/admin/ContentModerationScreen';
import SystemSettingsScreen from '../screens/admin/SystemSettingsScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AddSkillScreen from '../screens/skills/AddSkillScreen';
import SkillManagementScreen from '../screens/skills/SkillManagementScreen';

// Use optimized main navigator
import OptimizedMainTabNavigator from './OptimizedMainTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is already logged in when app starts
    console.log('🚀 AppNavigator: Checking auth status on startup');
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    // Log auth state changes and track navigation events
    console.log('🔄 Auth state changed:', { 
      isAuthenticated, 
      loading, 
      user: user ? { id: user.id, name: user.name } : null 
    });

    // Track authentication events
    if (!loading) {
      analyticsService.trackEvent('auth_state_changed', {
        is_authenticated: isAuthenticated,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [isAuthenticated, loading, user]);

  // Track navigation state changes
  const onNavigationStateChange = (state: any) => {
    if (state) {
      const currentRoute = state.routes[state.index];
      analyticsService.trackEvent('screen_view', {
        screen_name: currentRoute?.name,
        previous_screen: state.routes[state.index - 1]?.name,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log('🧭 Navigation decision:', isAuthenticated ? 'OptimizedMainTabNavigator' : 'Auth screens');

  return (
    <EnhancedErrorBoundary 
      level="screen" 
      context="navigation"
      onError={(error, errorInfo) => {
        console.error('🚨 Navigation error caught:', error);
        analyticsService.trackError(error, {
          context: 'navigation_error',
          component_stack: errorInfo.componentStack
        });
      }}
    >
      <NavigationContainer onStateChange={onNavigationStateChange}>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            // Performance optimizations
            detachPreviousScreen: true,
            cardStyle: { backgroundColor: 'transparent' },
            animationTypeForReplace: 'pop'
          }}
        >
          {isAuthenticated ? (
            // User is signed in - Use optimized screens
            <>
              <Stack.Screen 
                name="Main" 
                component={OptimizedMainTabNavigator}
                options={{ 
                  headerShown: false,
                  gestureEnabled: false // Prevent swipe to go back from main screen
                }}
              />
              
              <Stack.Screen 
                name="EditProfile" 
                component={EditProfileScreen}
                options={{ 
                  headerShown: true,
                  title: 'Edit Profile',
                  headerBackTitleVisible: false,
                  headerTintColor: '#007AFF'
                }}
              />
              
              <Stack.Screen 
                name="SkillManagement" 
                component={SkillManagementScreen}
                options={{ 
                  headerShown: true,
                  title: 'Manage Skills',
                  headerBackTitleVisible: false,
                  headerTintColor: '#007AFF'
                }}
              />
              
              <Stack.Screen 
                name="AddSkill" 
                component={AddSkillScreen}
                options={{ 
                  headerShown: true,
                  title: 'Add Skill',
                  headerBackTitleVisible: false,
                  headerTintColor: '#007AFF'
                }}
              />
              
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminDashboardScreen}
                options={{ 
                  headerShown: true,
                  title: 'Admin Dashboard',
                  headerBackTitleVisible: false,
                  headerTintColor: '#007AFF'
                }}
              />
              
              <Stack.Screen 
                name="ContentModeration" 
                component={ContentModerationScreen}
                options={{ 
                  headerShown: true,
                  title: 'Content Moderation',
                  headerBackTitleVisible: false,
                  headerTintColor: '#007AFF'
                }}
              />
              
              <Stack.Screen 
                name="SystemSettings" 
                component={SystemSettingsScreen}
                options={{ 
                  headerShown: true,
                  title: 'System Settings',
                  headerBackTitleVisible: false,
                  headerTintColor: '#007AFF'
                }}
              />
            </>
          ) : (
            // User is not signed in
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{
                  headerShown: false,
                  animationTypeForReplace: 'push'
                }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={{
                  headerShown: true,
                  title: 'Create Account',
                  headerBackTitleVisible: false,
                  headerTintColor: '#007AFF'
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </EnhancedErrorBoundary>
  );
};

export default AppNavigator;
