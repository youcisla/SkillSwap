import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import {
  CalendarStackParamList,
  HomeStackParamList,
  MatchesStackParamList,
  MessagesStackParamList,
  ProfileStackParamList,
  TabParamList
} from '../types';

// Import screens
import CalendarScreen from '../screens/CalendarScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import HomeScreen from '../screens/HomeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import MessagesScreen from '../screens/MessagesScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SessionDetailsScreen from '../screens/sessions/SessionDetailsScreen';
import AddSkillScreen from '../screens/skills/AddSkillScreen';
import SkillManagementScreen from '../screens/skills/SkillManagementScreen';
import UserListScreen from '../screens/UserListScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const MatchesStack = createStackNavigator<MatchesStackParamList>();
const MessagesStack = createStackNavigator<MessagesStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const CalendarStack = createStackNavigator<CalendarStackParamList>();

const HomeStackScreen = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen 
      name="HomeMain" 
      component={HomeScreen}
      options={{ title: 'SkillSwap' }}
    />
    <HomeStack.Screen 
      name="UserList" 
      component={UserListScreen}
      options={{ title: 'Users' }}
    />
    <HomeStack.Screen 
      name="UserProfile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <HomeStack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
  </HomeStack.Navigator>
);

const MatchesStackScreen = () => (
  <MatchesStack.Navigator>
    <MatchesStack.Screen 
      name="MatchesMain" 
      component={MatchesScreen}
      options={{ title: 'Matches' }}
    />
    <MatchesStack.Screen 
      name="MatchUserProfile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <MatchesStack.Screen 
      name="MatchChat" 
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
  </MatchesStack.Navigator>
);

const MessagesStackScreen = () => (
  <MessagesStack.Navigator>
    <MessagesStack.Screen 
      name="MessagesMain" 
      component={MessagesScreen}
      options={{ title: 'Messages' }}
    />
    <MessagesStack.Screen 
      name="MessageChat" 
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
  </MessagesStack.Navigator>
);

const ProfileStackScreen = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <ProfileStack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ title: 'Edit Profile' }}
    />
    <ProfileStack.Screen 
      name="SkillManagement" 
      component={SkillManagementScreen}
      options={{ title: 'Manage Skills' }}
    />
    <ProfileStack.Screen 
      name="AddSkill" 
      component={AddSkillScreen}
      options={{ title: 'Add Skill' }}
    />
  </ProfileStack.Navigator>
);

const CalendarStackScreen = () => (
  <CalendarStack.Navigator>
    <CalendarStack.Screen 
      name="CalendarMain" 
      component={CalendarScreen}
      options={{ title: 'Calendar' }}
    />
    <CalendarStack.Screen 
      name="SessionDetails" 
      component={SessionDetailsScreen}
      options={{ title: 'Session Details' }}
    />
  </CalendarStack.Navigator>
);

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Matches':
              iconName = 'people';
              break;
            case 'Messages':
              iconName = 'message';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Calendar':
              iconName = 'event';
              break;
            default:
              iconName = 'home';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ea',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Matches" component={MatchesStackScreen} />
      <Tab.Screen name="Messages" component={MessagesStackScreen} />
      <Tab.Screen name="Calendar" component={CalendarStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
