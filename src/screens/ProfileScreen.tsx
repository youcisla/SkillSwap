import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import {
    Card,
    Chip,
    Divider,
    IconButton,
    Paragraph,
    Text,
    Title,
    useTheme
} from 'react-native-paper';
import SafeAvatar from '../components/SafeAvatar';
import EnhancedButton from '../components/ui/EnhancedButton';
import { StatCard } from '../components/ui/EnhancedCard';
import LoadingState, { EmptyState } from '../components/ui/LoadingState';
import useHapticFeedback from '../hooks/useHapticFeedback';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';
import { checkFollowStatus, fetchFollowStats, followUser, unfollowUser } from '../store/slices/followSlice';
import { fetchUserSkills } from '../store/slices/skillSlice';
import { fetchOtherUserProfile, fetchUserProfile } from '../store/slices/userSlice';
import { colors, spacing } from '../theme';
import { HomeStackParamList, MatchesStackParamList, ProfileStackParamList } from '../types';
import ProfileDebugger from '../utils/profileDebugger';

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
  const theme = useTheme();
  const { triggerHaptic } = useHapticFeedback();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser, users, loading } = useAppSelector((state) => state.user);
  const { skills } = useAppSelector((state) => state.skills);
  const { isFollowing, followStats } = useAppSelector((state) => state.follows);

  const params = route.params as ProfileParams | undefined;
  const userId = params?.userId || user?.id;
  
  // iOS-specific fix: Ensure userId is properly converted to string
  const normalizedUserId = userId ? String(userId) : undefined;
  const isOwnProfile = !params?.userId || String(params?.userId) === String(user?.id);
  
  const profileUser = isOwnProfile ? currentUser : users.find(u => String(u.id) === normalizedUserId);
  const userSkills = skills.filter(skill => String(skill.userId) === normalizedUserId);
  const teachSkills = userSkills.filter(skill => skill.type === 'teach');
  const learnSkills = userSkills.filter(skill => skill.type === 'learn');

  useEffect(() => {
    console.log('ProfileScreen: Effect triggered with:', {
      userId,
      normalizedUserId,
      isOwnProfile,
      currentUserId: user?.id,
      params: route.params
    });
    
    ProfileDebugger.logProfileNavigation(normalizedUserId || 'undefined', route.params);
    
    if (normalizedUserId) {
      console.log('ProfileScreen: Fetching profile for user:', normalizedUserId);
      
      // Use different actions based on whether it's the current user or another user
      const fetchAction = isOwnProfile ? fetchUserProfile : fetchOtherUserProfile;
      
      dispatch(fetchAction(normalizedUserId))
        .unwrap()
        .then((fetchedUser) => {
          console.log('ProfileScreen: Successfully fetched user:', fetchedUser.id, fetchedUser.name);
          ProfileDebugger.logUserFetch(normalizedUserId, true);
        })
        .catch((error) => {
          console.error('ProfileScreen: Failed to fetch user profile:', error);
          ProfileDebugger.logUserFetch(normalizedUserId, false, error.message);
        });
        
      dispatch(fetchUserSkills(normalizedUserId));
      dispatch(fetchFollowStats(normalizedUserId));
      
      // Check follow status if viewing another user's profile
      if (!isOwnProfile && user?.id) {
        dispatch(checkFollowStatus(normalizedUserId));
      }
    } else {
      console.warn('ProfileScreen: No userId provided');
    }
  }, [normalizedUserId, isOwnProfile, user?.id]);

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

  const renderIcon = (iconName: string, color?: string, size: number = 20) => (
    <MaterialCommunityIcons 
      name={iconName as any} 
      size={size} 
      color={color || theme.colors.primary} 
    />
  );

  const handleStartChat = () => {
    if (normalizedUserId && normalizedUserId !== String(user?.id)) {
      // Generate consistent chat ID
      const sortedIds = [user?.id, normalizedUserId].sort();
      const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
      
      // Navigate to Messages tab and then to chat
      try {
        (navigation as any).navigate('Messages', { 
          screen: 'MessageChat',
          params: { chatId, otherUserId: normalizedUserId }
        });
      } catch (error) {
        console.log('Navigation error:', error);
        // Fallback: navigate directly if tab navigation fails
        try {
          (navigation as any).navigate('MessageChat', { 
            chatId, 
            otherUserId: normalizedUserId 
          });
        } catch (error2) {
          console.log('Direct navigation also failed:', error2);
        }
      }
    }
  };

  const handleRequestSession = () => {
    if (!normalizedUserId || normalizedUserId === String(user?.id)) {
      return;
    }

    // If the user has teaching skills, show them for selection
    if (teachSkills.length > 0) {
      const skillOptions = teachSkills.map(skill => ({
        text: `${skill.name} (${skill.level})`,
        onPress: () => {
          try {
            // Navigate to calendar first to select date/time, then to session request
            (navigation as any).navigate('Calendar', {
              screen: 'CalendarMain',
              params: { 
                preSelectSkill: { 
                  skillId: skill.id, 
                  skillName: skill.name, 
                  otherUserId: normalizedUserId,
                  isTeaching: true 
                } 
              }
            });
          } catch (error) {
            console.log('Session request navigation error:', error);
            // Fallback: navigate directly to session request with default time
            (navigation as any).navigate('SessionRequest', {
              otherUserId: normalizedUserId,
              skillId: skill.id,
              skillName: skill.name,
              isTeaching: true
            });
          }
        }
      }));

      // Add cancel option
      skillOptions.push({
        text: 'Cancel',
        onPress: () => {}
      });

      Alert.alert(
        'Select a Skill',
        'Choose which skill you want to request a session for:',
        skillOptions
      );
    } else {
      // No skills available - show message
      Alert.alert(
        'No Teaching Skills',
        'This user has not added any teaching skills yet. Session requests are only available for skills they can teach.'
      );
    }
  };

  const handleFollowToggle = async () => {
    if (!normalizedUserId || !user?.id) return;
    
    try {
      const currentFollowStatus = isFollowing[normalizedUserId];
      if (currentFollowStatus) {
        await dispatch(unfollowUser(normalizedUserId)).unwrap();
      } else {
        await dispatch(followUser(normalizedUserId)).unwrap();
      }
      // Refresh follow stats
      dispatch(fetchFollowStats(normalizedUserId));
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  const handleFollowersPress = () => {
    if (normalizedUserId) {
      (navigation as any).navigate('Followers', { userId: normalizedUserId });
    }
  };

  const handleFollowingPress = () => {
    if (normalizedUserId) {
      (navigation as any).navigate('Following', { userId: normalizedUserId });
    }
  };

  if (loading && !profileUser) {
    console.log('ProfileScreen: Loading state - userId:', userId, 'profileUser:', !!profileUser);
    return <LoadingState fullScreen text="Loading profile..." />;
  }

  if (!profileUser) {
    console.error('ProfileScreen: User not found', {
      userId,
      normalizedUserId,
      isOwnProfile,
      currentUserExists: !!currentUser,
      usersArrayLength: users.length,
      usersIds: users.map(u => u.id),
      requestedUserId: userId
    });
    
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          icon={renderIcon("account-question", colors.neutral[400], 32)}
          title="User not found"
          description={
            isOwnProfile 
              ? "Your profile couldn't be loaded. Please try refreshing or logging in again."
              : `This user profile could not be loaded. ${__DEV__ ? `(ID: ${userId})` : ''}`
          }
          action={
            <EnhancedButton
              title={isOwnProfile ? "Refresh Profile" : "Go Back"}
              onPress={() => {
                if (isOwnProfile) {
                  // Retry fetching own profile
                  if (user?.id) {
                    dispatch(fetchUserProfile(user.id));
                  }
                } else {
                  navigation.goBack();
                }
              }}
              variant="primary"
              size="medium"
              hapticFeedback
            />
          }
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
            <SafeAvatar 
              size={80} 
              source={profileUser.profileImage ? { uri: profileUser.profileImage } : undefined}
              fallbackText={profileUser.name}
              style={styles.avatar}
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
                    title={normalizedUserId && isFollowing[normalizedUserId] ? "Unfollow" : "Follow"}
                    variant={normalizedUserId && isFollowing[normalizedUserId] ? "outline" : "primary"}
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
              icon={<IconButton icon="account-voice" size={32} iconColor={colors.neutral[400]} />}
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
              icon={<IconButton icon="lightbulb-outline" size={32} iconColor={colors.neutral[400]} />}
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
              icon={renderIcon("cog")}
              hapticFeedback
            />
            <EnhancedButton
              title="Edit Profile"
              variant="outline"
              onPress={() => (navigation as any).navigate('EditProfile')}
              style={styles.actionButton}
              icon={renderIcon("account-edit")}
              hapticFeedback
            />
            
            {/* Admin Panel Access - Only for admins */}
            {(user?.role === 'admin' || user?.role === 'super-admin') && (
              <EnhancedButton
                title="Admin Dashboard"
                variant="primary"
                onPress={() => (navigation as any).navigate('AdminDashboard')}
                style={styles.actionButton}
                icon={renderIcon("shield-account")}
                hapticFeedback
              />
            )}
            
            <Divider style={styles.divider} />
            <EnhancedButton
              title="Logout"
              variant="danger"
              onPress={handleLogout}
              style={styles.actionButton}
              icon={renderIcon("logout")}
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
              icon={renderIcon("message")}
              hapticFeedback
            />
            <EnhancedButton
              title="Request Session"
              variant="outline"
              onPress={handleRequestSession}
              style={styles.actionButton}
              icon={renderIcon("calendar-plus")}
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
    backgroundColor: colors.neutral[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  headerCard: {
    margin: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: 12,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 40,
  },
  profileInfo: {
    marginLeft: spacing.xl,
    flex: 1,
  },
  followStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
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
    gap: spacing.md,
  },
  followButton: {
    minWidth: 100,
  },
  messageIcon: {
    backgroundColor: colors.primary.main,
  },
  rating: {
    color: colors.neutral[600],
    fontSize: 14,
    marginTop: spacing.xs,
  },
  bioSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  skillsCard: {
    margin: spacing.xl,
    marginTop: spacing.md,
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
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionsCard: {
    margin: spacing.xl,
    marginTop: spacing.md,
    borderRadius: 12,
    elevation: 2,
  },
  actionButton: {
    marginVertical: spacing.xs,
  },
  divider: {
    marginVertical: spacing.xl,
    backgroundColor: colors.neutral[200],
  },
});

export default ProfileScreen;
