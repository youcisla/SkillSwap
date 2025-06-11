import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    IconButton,
    Paragraph,
    Text,
    Title,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';
import { fetchUserSkills } from '../store/slices/skillSlice';
import { fetchUserProfile } from '../store/slices/userSlice';

// Generic props interface for ProfileScreen that can work with any stack
interface ProfileParams {
  userId?: string;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser, users, loading } = useAppSelector((state) => state.user);
  const { skills } = useAppSelector((state) => state.skills);

  const params = route.params as ProfileParams;
  const userId = params?.userId || user?.id;
  const isOwnProfile = !params?.userId || params?.userId === user?.id;
  
  const profileUser = isOwnProfile ? currentUser : users.find(u => u.id === userId);
  const userSkills = skills.filter(skill => skill.userId === userId);
  const teachSkills = userSkills; // In a real app, you'd filter by type
  const learnSkills = profileUser?.skillsToLearn || [];

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserProfile(userId));
      dispatch(fetchUserSkills(userId));
    }
  }, [userId]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const handleStartChat = () => {
    if (userId && userId !== user?.id) {
      // Type assertion to handle different stack types
      (navigation as any).navigate('Chat', { 
        chatId: `${user?.id}-${userId}`, 
        otherUserId: userId 
      });
    }
  };

  if (!profileUser) {
    return (
      <View style={styles.centerContainer}>
        <Text>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Image 
              size={80} 
              source={{ uri: profileUser.profileImage || 'https://via.placeholder.com/80' }}
            />
            <View style={styles.profileInfo}>
              <Title>{profileUser.name}</Title>
              <Paragraph>{profileUser.city}</Paragraph>
              {profileUser.rating && (
                <Text style={styles.rating}>
                  ⭐ {profileUser.rating.toFixed(1)} ({profileUser.totalSessions || 0} sessions)
                </Text>
              )}
            </View>
            {isOwnProfile ? (
              <IconButton
                icon="pencil"
                onPress={() => (navigation as any).navigate('EditProfile')}
              />
            ) : (
              <IconButton
                icon="message"
                onPress={handleStartChat}
              />
            )}
          </View>
          
          {profileUser.bio && (
            <View style={styles.bioSection}>
              <Paragraph>{profileUser.bio}</Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Skills to Teach */}
      <Card style={styles.skillsCard}>
        <Card.Content>
          <View style={styles.skillsHeader}>
            <Title>Skills to Teach ({teachSkills.length})</Title>
            {isOwnProfile && (
              <IconButton
                icon="plus"
                onPress={() => (navigation as any).navigate('AddSkill', { type: 'teach' })}
              />
            )}
          </View>
          
          {teachSkills.length > 0 ? (
            <View style={styles.chipContainer}>
              {teachSkills.map((skill) => (
                <Chip key={skill.id} style={styles.chip}>
                  {skill.name} - {skill.level}
                </Chip>
              ))}
            </View>
          ) : (
            <Paragraph>No skills to teach added yet.</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Skills to Learn */}
      <Card style={styles.skillsCard}>
        <Card.Content>
          <View style={styles.skillsHeader}>
            <Title>Skills to Learn ({learnSkills.length})</Title>
            {isOwnProfile && (
              <IconButton
                icon="plus"
                onPress={() => (navigation as any).navigate('AddSkill', { type: 'learn' })}
              />
            )}
          </View>
          
          {learnSkills.length > 0 ? (
            <View style={styles.chipContainer}>
              {learnSkills.map((skill) => (
                <Chip key={skill.id} style={styles.chip}>
                  {skill.name}
                </Chip>
              ))}
            </View>
          ) : (
            <Paragraph>No skills to learn added yet.</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      {isOwnProfile && (
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title>Account</Title>
            <Button
              mode="outlined"
              onPress={() => (navigation as any).navigate('SkillManagement')}
              style={styles.actionButton}
              icon="cog"
            >
              Manage Skills
            </Button>
            <Button
              mode="outlined"
              onPress={() => (navigation as any).navigate('EditProfile')}
              style={styles.actionButton}
              icon="account-edit"
            >
              Edit Profile
            </Button>
            <Divider style={styles.divider} />
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={[styles.actionButton, styles.logoutButton]}
              icon="logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Contact Actions for Other Users */}
      {!isOwnProfile && (
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleStartChat}
              style={styles.actionButton}
              icon="message"
            >
              Send Message
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                // TODO: Implement session request
                Alert.alert('Coming Soon', 'Session request feature will be available soon!');
              }}
              style={styles.actionButton}
              icon="calendar-plus"
            >
              Request Session
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  rating: {
    color: '#666',
    fontSize: 14,
  },
  bioSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  skillsCard: {
    margin: 16,
    marginTop: 8,
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
  },
  actionsCard: {
    margin: 16,
    marginTop: 8,
  },
  actionButton: {
    marginVertical: 4,
  },
  logoutButton: {
    borderColor: '#f44336',
  },
  divider: {
    marginVertical: 16,
  },
});

export default ProfileScreen;
