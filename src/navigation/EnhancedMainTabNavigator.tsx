// Enhanced Main Tab Navigator with optimizations
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Platform, View } from 'react-native';
import { Badge, useTheme } from 'react-native-paper';
import {
    CalendarStackParamList,
    HomeStackParamList,
    MatchesStackParamList,
    MessagesStackParamList,
    ProfileStackParamList,
    TabParamList
} from '../types';

// Import optimized screens
import CalendarScreen from '../screens/CalendarScreen';
import MatchesScreen from '../screens/MatchesScreen';
import OptimizedHomeScreen from '../screens/OptimizedHomeScreen';
import OptimizedMessagesScreen from '../screens/OptimizedMessagesScreen';
import OptimizedUserListScreen from '../screens/OptimizedUserListScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Import other screens
import ChatScreen from '../screens/chat/ChatScreen';
import FollowersScreen from '../screens/follows/FollowersScreen';
import FollowingScreen from '../screens/follows/FollowingScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SessionDetailsScreen from '../screens/sessions/SessionDetailsScreen';
import AddSkillScreen from '../screens/skills/AddSkillScreen';
import SkillManagementScreen from '../screens/skills/SkillManagementScreen';

// Import store
import { useAppSelector } from '../store';

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const MessagesStack = createStackNavigator<MessagesStackParamList>();
const MatchesStack = createStackNavigator<MatchesStackParamList>();
const CalendarStack = createStackNavigator<CalendarStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Enhanced Home Stack with optimized screens
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeMain" 
        component={OptimizedHomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="UserList" 
        component={OptimizedUserListScreen}
        options={{ 
          title: 'Find Users',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <HomeStack.Screen 
        name="UserProfile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
      <HomeStack.Screen 
        name="HomeChat" 
        component={ChatScreen}
        options={{
          title: 'Chat',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
    </HomeStack.Navigator>
  );
}

// Enhanced Messages Stack with real-time features
function MessagesStackNavigator() {
  return (
    <MessagesStack.Navigator>
      <MessagesStack.Screen 
        name="MessagesMain" 
        component={OptimizedMessagesScreen}
        options={{ 
          title: 'Messages',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <MessagesStack.Screen 
        name="MessageChat" 
        component={ChatScreen}
        options={{
          title: 'Chat',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
    </MessagesStack.Navigator>
  );
}

// Enhanced Matches Stack
function MatchesStackNavigator() {
  return (
    <MatchesStack.Navigator>
      <MatchesStack.Screen 
        name="MatchesMain" 
        component={MatchesScreen}
        options={{ 
          title: 'Matches',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <MatchesStack.Screen 
        name="MatchUserProfile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
    </MatchesStack.Navigator>
  );
}

// Enhanced Calendar Stack
function CalendarStackNavigator() {
  return (
    <CalendarStack.Navigator>
      <CalendarStack.Screen 
        name="CalendarMain" 
        component={CalendarScreen}
        options={{ 
          title: 'Sessions',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <CalendarStack.Screen 
        name="SessionDetails" 
        component={SessionDetailsScreen}
        options={{ 
          title: 'Session Details',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
    </CalendarStack.Navigator>
  );
}

// Enhanced Profile Stack
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Edit Profile',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
      <ProfileStack.Screen 
        name="SkillManagement" 
        component={SkillManagementScreen}
        options={{ 
          title: 'Manage Skills',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
      <ProfileStack.Screen 
        name="AddSkill" 
        component={AddSkillScreen}
        options={{ 
          title: 'Add Skill',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
      <ProfileStack.Screen 
        name="Followers" 
        component={FollowersScreen}
        options={{ 
          title: 'Followers',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
      <ProfileStack.Screen 
        name="Following" 
        component={FollowingScreen}
        options={{ 
          title: 'Following',
          headerStyle: { backgroundColor: '#6200ea' },
          headerTintColor: 'white'
        }}
      />
    </ProfileStack.Navigator>
  );
}

// Enhanced Tab Bar Icon component
const TabBarIcon = ({ name, color, size, badgeCount }: {
  name: string;
  color: string;
  size: number;
  badgeCount?: number;
}) => {
  return (
    <View style={{ position: 'relative' }}>
      <MaterialIcons name={name as any} size={size} color={color} />
      {badgeCount && badgeCount > 0 && (
        <Badge
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            backgroundColor: '#ff4444',
            color: 'white',
            fontSize: 10,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            textAlign: 'center',
            lineHeight: 16,
          }}
        >
          {badgeCount > 99 ? '99+' : badgeCount.toString()}
        </Badge>
      )}
    </View>
  );
};

// Enhanced Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  const theme = useTheme();
  const { chats } = useAppSelector((state) => state.messages);
  const { matches } = useAppSelector((state) => state.matches);
  const { sessions } = useAppSelector((state) => state.sessions);

  // Calculate unread message count (simplified)
  const unreadMessageCount = chats.filter(chat => {
    // Simple check for new messages - can be enhanced with actual unread logic
    return chat.lastMessage && new Date(chat.lastMessage.timestamp) > new Date(Date.now() - 3600000);
  }).length;

  // Calculate new matches count (matches from last 24 hours)
  const newMatchesCount = matches.filter(match => {
    const matchDate = new Date(match.createdAt);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return matchDate > dayAgo;
  }).length;

  // Calculate upcoming sessions count
  const upcomingSessionsCount = sessions.filter(session => {
    const sessionDate = new Date(session.scheduledAt);
    const now = new Date();
    return sessionDate > now && session.status === 'confirmed';
  }).length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStackNavigator}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon 
              name="message" 
              color={color} 
              size={size} 
              badgeCount={unreadMessageCount}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesStackNavigator}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon 
              name="favorite" 
              color={color} 
              size={size} 
              badgeCount={newMatchesCount}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarStackNavigator}
        options={{
          tabBarLabel: 'Sessions',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon 
              name="event" 
              color={color} 
              size={size} 
              badgeCount={upcomingSessionsCount}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
