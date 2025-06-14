import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    Avatar,
    Card,
    Chip,
    Divider,
    IconButton,
    Paragraph,
    Text,
    Title
} from 'react-native-paper';
import EnhancedButton from '../components/ui/EnhancedButton';
import { StatCard } from '../components/ui/EnhancedCard';
import LoadingState, { EmptyState } from '../components/ui/LoadingState';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';
import { checkFollowStatus, fetchFollowStats, followUser, unfollowUser } from '../store/slices/followSlice';
import { fetchUserSkills } from '../store/slices/skillSlice';
import { fetchUserProfile } from '../store/slices/userSlice';
import { colors, spacing } from '../theme';
import { HomeStackParamList, MatchesStackParamList, ProfileStackParamList } from '../types';

// Type for navigation that can work with multiple stacks
type ProfileNavigationProp = 
  | StackNavigationProp<HomeStackParamList, 'UserProfile'>
  | StackNavigationProp<MatchesStackParamList, 'MatchUserProfile'>
  | StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

type ProfileRouteProp = 
  | RouteProp<HomeStackParamList, 'UserProfile'>
  | RouteProp<MatchesStackParamList, 'MatchUserProfile'>
  | RouteProp<ProfileStackParamList, 'ProfileMain'>;

// Generic props interface for ProfileScreen that can work with any stack
interface ProfileParams {
  userId?: string;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const route = useRoute<ProfileRouteProp>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser, users, loading } = useAppSelector((state) => state.user);
  const { skills } = useAppSelector((state) => state.skills);
  const { isFollowing, followStats } = useAppSelector((state) => state.follows);

  const params = route.params as ProfileParams | undefined;
  const userId = params?.userId || user?.id;
  const isOwnProfile = !params?.userId || params?.userId === user?.id;
  
  const profileUser = isOwnProfile ? currentUser : users.find(u => u.id === userId);
  const userSkills = skills.filter(skill => skill.userId === userId);
  const teachSkills = userSkills.filter(skill => skill.type === 'teach');
  const learnSkills = userSkills.filter(skill => skill.type === 'learn');

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserProfile(userId));
      dispatch(fetchUserSkills(userId));
      dispatch(fetchFollowStats(userId));
      
      // Check follow status if viewing another user's profile
      if (!isOwnProfile && user?.id) {
        dispatch(checkFollowStatus(userId));
      }
    }
  }, [userId, isOwnProfile, user?.id]);

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
      // Generate consistent chat ID
      const sortedIds = [user?.id, userId].sort();
      const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
      
      // Navigate to Messages tab and then to chat
      try {
        (navigation as any).navigate('Messages', { 
          screen: 'MessageChat',
          params: { chatId, otherUserId: userId }
        });
      } catch (error) {
        console.log('Navigation error:', error);
        // Fallback: navigate directly if tab navigation fails
        try {
          (navigation as any).navigate('MessageChat', { 
            chatId, 
            otherUserId: userId 
          });
        } catch (error2) {
          console.log('Direct navigation also failed:', error2);
        }
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!userId || !user?.id) return;
    
    try {
      const currentFollowStatus = isFollowing[userId];
      if (currentFollowStatus) {
        await dispatch(unfollowUser(userId)).unwrap();
      } else {
        await dispatch(followUser(userId)).unwrap();
      }
      // Refresh follow stats
      dispatch(fetchFollowStats(userId));
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  const handleFollowersPress = () => {
    if (userId) {
      (navigation as any).navigate('Followers', { userId });
    }
  };

  const handleFollowingPress = () => {
    if (userId) {
      (navigation as any).navigate('Following', { userId });
    }
  };

  if (loading && !profileUser) {
    return <LoadingState fullScreen text="Loading profile..." />;
  }

  if (!profileUser) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          icon="account-question"
          title="User not found"
          description="This user profile could not be loaded."
        />
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
              source={{ uri: profileUser.profileImage || `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#6200ea"/><text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-size="32" font-family="Arial">${profileUser.name.charAt(0).toUpperCase()}</text></svg>`)}` }}
            />
            <View style={styles.profileInfo}>
              <Title>{profileUser.name}</Title>
              <Paragraph>{profileUser.city}</Paragraph>
              {profileUser.rating && (
                <Text style={styles.rating}>
                  ⭐ {profileUser.rating.toFixed(1)} ({profileUser.totalSessions || 0} sessions)
                </Text>
              )}
              
              {/* Follow Stats */}
              <View style={styles.followStats}>
                <StatCard
                  title="Followers"
                  value={followStats?.followersCount || profileUser.followersCount || 0}
                  onPress={handleFollowersPress}
                  style={styles.statCard}
                />
                <StatCard
                  title="Following"
                  value={followStats?.followingCount || profileUser.followingCount || 0}
                  onPress={handleFollowingPress}
                  style={styles.statCard}
                />
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.profileActions}>
              {isOwnProfile ? (
                <IconButton
                  icon="pencil"
                  onPress={() => (navigation as any).navigate('EditProfile')}
                />
              ) : (
                <View style={styles.otherUserActions}>
                  <EnhancedButton
                    title={userId && isFollowing[userId] ? "Unfollow" : "Follow"}
                    variant={userId && isFollowing[userId] ? "outline" : "primary"}
                    onPress={handleFollowToggle}
                    style={styles.followButton}
                    hapticFeedback
                  />
                  <IconButton
                    icon="message"
                    onPress={handleStartChat}
                    mode="contained"
                    style={styles.messageIcon}
                  />
                </View>
              )}
            </View>
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
            <EmptyState
              icon="school"
              title="No teaching skills yet"
              description={isOwnProfile ? "Add skills you can teach to help others learn!" : "This user hasn't added any teaching skills yet."}
            />
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
                  {skill.name} - {skill.level}
                </Chip>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="lightbulb-outline"
              title="No learning goals yet"
              description={isOwnProfile ? "Add skills you want to learn from others!" : "This user hasn't added any learning goals yet."}
            />
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      {isOwnProfile && (
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title>Account</Title>
            <EnhancedButton
              title="Manage Skills"
              variant="outline"
              onPress={() => (navigation as any).navigate('SkillManagement')}
              style={styles.actionButton}
              icon="cog"
              hapticFeedback
            />
            <EnhancedButton
              title="Edit Profile"
              variant="outline"
              onPress={() => (navigation as any).navigate('EditProfile')}
              style={styles.actionButton}
              icon="account-edit"
              hapticFeedback
            />
            
            {/* Admin Panel Access - Only for admins */}
            {(user?.role === 'admin' || user?.role === 'super-admin') && (
              <EnhancedButton
                title="Admin Dashboard"
                variant="primary"
                onPress={() => (navigation as any).navigate('AdminDashboard')}
                style={styles.actionButton}
                icon="shield-account"
                hapticFeedback
              />
            )}
            
            <Divider style={styles.divider} />
            <EnhancedButton
              title="Logout"
              variant="danger"
              onPress={handleLogout}
              style={styles.actionButton}
              icon="logout"
              hapticFeedback
            />
          </Card.Content>
        </Card>
      )}

      {/* Contact Actions for Other Users */}
      {!isOwnProfile && (
        <Card style={styles.actionsCard}>
          <Card.Content>
            <EnhancedButton
              title="Send Message"
              variant="primary"
              onPress={handleStartChat}
              style={styles.actionButton}
              icon="message"
              hapticFeedback
            />
            <EnhancedButton
              title="Request Session"
              variant="outline"
              onPress={() => {
                // TODO: Implement session request
                Alert.alert('Coming Soon', 'Session request feature will be available soon!');
              }}
              style={styles.actionButton}
              icon="calendar-plus"
              hapticFeedback
            />
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  headerCard: {
    margin: spacing.medium,
    marginBottom: spacing.small,
    borderRadius: 12,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing.medium,
    flex: 1,
  },
  followStats: {
    flexDirection: 'row',
    marginTop: spacing.small,
    gap: spacing.small,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  profileActions: {
    alignItems: 'center',
  },
  otherUserActions: {
    alignItems: 'center',
    gap: spacing.small,
  },
  followButton: {
    minWidth: 100,
  },
  messageIcon: {
    backgroundColor: colors.primary,
  },
  rating: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  bioSection: {
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  skillsCard: {
    margin: spacing.medium,
    marginTop: spacing.small,
    borderRadius: 12,
    elevation: 2,
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.small,
    gap: spacing.xs,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionsCard: {
    margin: spacing.medium,
    marginTop: spacing.small,
    borderRadius: 12,
    elevation: 2,
  },
  actionButton: {
    marginVertical: spacing.xs,
  },
  divider: {
    marginVertical: spacing.medium,
    backgroundColor: colors.border,
  },
});

export default ProfileScreen;
