import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
import SessionRequestScreen from '../screens/sessions/SessionRequestScreen';
import AddSkillScreen from '../screens/skills/AddSkillScreen';
import SkillManagementScreen from '../screens/skills/SkillManagementScreen';
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
    // Log auth state changes
    console.log('🔄 Auth state changed:', { 
      isAuthenticated, 
      loading, 
      user: user ? { id: user.id, name: user.name } : null 
    });
  }, [isAuthenticated, loading, user]);

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
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
      >
        {isAuthenticated ? (
          // User is signed in
          <>
            <Stack.Screen 
              name="Main" 
              component={OptimizedMainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ 
                headerShown: true,
                title: 'Edit Profile'
              }}
            />
            <Stack.Screen 
              name="SkillManagement" 
              component={SkillManagementScreen}
              options={{ 
                headerShown: true,
                title: 'Manage Skills'
              }}
            />
            <Stack.Screen 
              name="AddSkill" 
              component={AddSkillScreen}
              options={{ 
                headerShown: true,
                title: 'Add Skill'
              }}
            />
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboardScreen}
              options={{ 
                headerShown: true,
                title: 'Admin Dashboard'
              }}
            />
            <Stack.Screen 
              name="ContentModeration" 
              component={ContentModerationScreen}
              options={{ 
                headerShown: true,
                title: 'Content Moderation'
              }}
            />
            <Stack.Screen 
              name="SystemSettings" 
              component={SystemSettingsScreen}
              options={{ 
                headerShown: true,
                title: 'System Settings'
              }}
            />
            <Stack.Screen 
              name="SessionRequest" 
              component={SessionRequestScreen}
              options={{ 
                headerShown: true,
                title: 'Request Session'
              }}
            />
          </>
        ) : (
          // User is not signed in
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
