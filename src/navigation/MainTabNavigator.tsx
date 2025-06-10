import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { RootStackParamList, TabParamList } from '../types';

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
const Stack = createStackNavigator<RootStackParamList>();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ title: 'SkillSwap' }}
    />
    <Stack.Screen 
      name="UserList" 
      component={UserListScreen}
      options={{ title: 'Users' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
  </Stack.Navigator>
);

const MatchesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Matches" 
      component={MatchesScreen}
      options={{ title: 'Matches' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
  </Stack.Navigator>
);

const MessagesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Messages" 
      component={MessagesScreen}
      options={{ title: 'Messages' }}
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ title: 'Edit Profile' }}
    />
    <Stack.Screen 
      name="SkillManagement" 
      component={SkillManagementScreen}
      options={{ title: 'Manage Skills' }}
    />
    <Stack.Screen 
      name="AddSkill" 
      component={AddSkillScreen}
      options={{ title: 'Add Skill' }}
    />
  </Stack.Navigator>
);

const CalendarStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Calendar" 
      component={CalendarScreen}
      options={{ title: 'Calendar' }}
    />
    <Stack.Screen 
      name="SessionDetails" 
      component={SessionDetailsScreen}
      options={{ title: 'Session Details' }}
    />
  </Stack.Navigator>
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Matches" component={MatchesStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
