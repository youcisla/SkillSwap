import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import {
    Chip,
    IconButton,
    Paragraph,
    Searchbar,
    SegmentedButtons,
    Text,
    Title,
    useTheme
} from 'react-native-paper';
import SafeAvatar from '../components/SafeAvatar';
import EnhancedButton from '../components/ui/EnhancedButton';
import EnhancedCard from '../comp      {/* Users List */}
      <VirtualizedList
        data={filteredUsers}
        renderItem={({ item: userProfile }: { item: UserProfile }) => renderUserItem({ item: userProfile })}
        keyExtractor={(item: UserProfile) => item.id}
        estimatedItemSize={120}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />hancedCard';
import LoadingState, { EmptyState, SkeletonCard } from '../components/ui/LoadingState';
import { SelectableItem } from '../components/ui/MultiSelection';
// Enhanced components and hooks
// Enhanced components and hooks
import { VirtualizedList } from '../components/optimized/VirtualizedList';
import { useOptimizedQuery } from '../hooks/useOptimizedQuery';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useAdvancedAnimation } from '../hooks/useAdvancedAnimation';
import { EnhancedApiService } from '../services/enhancedApiService';
import useHapticFeedback from '../hooks/useHapticFeedback';
import { useMultiSelection } from '../hooks/useMultiSelection';
import { useAppDispatch, useAppSelector } from '../store';
import { checkFollowStatus, followUser, unfollowUser } from '../store/slices/followSlice';
import { searchUsers } from '../store/slices/userSlice';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { HomeStackParamList, UserProfile } from '../types';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

type UserListScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'UserList'>;
type UserListScreenRouteProp = RouteProp<HomeStackParamList, 'UserList'>;

interface Props {
  navigation: UserListScreenNavigationProp;
  route: UserListScreenRouteProp;
}

const UserListScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { triggerHaptic } = useHapticFeedback();
  const { user } = useAppSelector((state) => state.auth);
  const { users, loading, error } = useAppSelector((state) => state.user);
  const { currentUser } = useAppSelector((state) => state.user);
  const { isFollowing } = useAppSelector((state) => state.follows);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Multi-selection hook
  const userSelection = useMultiSelection<UserProfile>(
    (user) => user.id,
    { allowSelectAll: true }
  );

  const initialSkillId = route.params?.skillId;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Load users when debounced search query or filter changes
  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [debouncedSearchQuery, filterType, currentUser?.id]);

  useEffect(() => {
    if (initialSkillId) {
      setSearchQuery(initialSkillId);
    }
  }, [initialSkillId]);

  const loadUsers = useCallback(async () => {
    if (!currentUser) {
      console.log('No current user, skipping search');
      return;
    }

    try {
      const filters: any = {};

      // Apply skill-based filters
      if (filterType === 'teachers' && currentUser?.skillsToLearn && currentUser.skillsToLearn.length > 0) {
        // Find users who can teach what current user wants to learn
        filters.skillsToTeach = currentUser.skillsToLearn.map(skill => skill.name);
      } else if (filterType === 'students' && currentUser?.skillsToTeach && currentUser.skillsToTeach.length > 0) {
        // Find users who want to learn what current user can teach
        filters.skillsToLearn = currentUser.skillsToTeach.map(skill => skill.name);
      }

      console.log('Search parameters:', { query: debouncedSearchQuery, filters, filterType });
      
      await dispatch(searchUsers({ 
        query: debouncedSearchQuery || '', 
        filters: Object.keys(filters).length > 0 ? filters : undefined 
      })).unwrap();
      
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [dispatch, debouncedSearchQuery, filterType, currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleFollowToggle = async (userId: string) => {
    try {
      const currentFollowStatus = isFollowing[userId];
      if (currentFollowStatus) {
        await dispatch(unfollowUser(userId)).unwrap();
      } else {
        await dispatch(followUser(userId)).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    }
  };

  // Check follow status for all users when they load
  useEffect(() => {
    if (users.length > 0 && user?.id) {
      users.forEach(userProfile => {
        if (userProfile.id !== user.id) {
          dispatch(checkFollowStatus(userProfile.id));
        }
      });
    }
  }, [users, user?.id]);

  const getCompatibilityScore = (otherUser: UserProfile) => {
    if (!currentUser) return 0;

    const myTeachSkills = currentUser.skillsToTeach?.map(s => s.name) || [];
    const myLearnSkills = currentUser.skillsToLearn?.map(s => s.name) || [];
    const theirTeachSkills = otherUser.skillsToTeach?.map(s => s.name) || [];
    const theirLearnSkills = otherUser.skillsToLearn?.map(s => s.name) || [];

    const canTeachThem = myTeachSkills.filter(skill => theirLearnSkills.includes(skill));
    const canLearnFromThem = theirTeachSkills.filter(skill => myLearnSkills.includes(skill));

    const totalPossibleMatches = Math.max(myTeachSkills.length + myLearnSkills.length, 1);
    const actualMatches = canTeachThem.length + canLearnFromThem.length;

    return Math.round((actualMatches / totalPossibleMatches) * 100);
  };

  const filteredUsers = users
    .filter(u => u.id !== user?.id) // Exclude current user
    .sort((a, b) => {
      const scoreA = getCompatibilityScore(a);
      const scoreB = getCompatibilityScore(b);
      
      // First sort by compatibility score (descending)
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      // Then by name (ascending) for consistent ordering
      return a.name.localeCompare(b.name);
    });

  // Debug logging
  console.log('All users from Redux state:', users.length);
  console.log('Current user ID:', user?.id);
  console.log('Filtered users count:', filteredUsers.length);
  console.log('Filter type:', filterType);

  const handleBulkFollow = async () => {
    const selectedUsers = filteredUsers.filter(user => userSelection.isSelected(user));
    
    try {
      await Promise.all(
        selectedUsers.map(user => dispatch(followUser(user.id)).unwrap())
      );
      userSelection.deselectAll();
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Failed to follow users:', error);
    }
  };

  const handleBulkUnfollow = async () => {
    const selectedUsers = filteredUsers.filter(user => userSelection.isSelected(user));
    
    try {
      await Promise.all(
        selectedUsers.map(user => dispatch(unfollowUser(user.id)).unwrap())
      );
      userSelection.deselectAll();
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Failed to unfollow users:', error);
    }
  };

  const handleStartSelection = () => {
    setIsSelectionMode(true);
  };

  const handleCancelSelection = () => {
    userSelection.deselectAll();
    setIsSelectionMode(false);
  };

  const renderUserItem = ({ item: userProfile }: { item: UserProfile }) => {
    const compatibilityScore = getCompatibilityScore(userProfile);
    
    if (isSelectionMode) {
      return (
        <SelectableItem
          isSelected={userSelection.isSelected(userProfile)}
          onToggleSelection={() => userSelection.toggleSelection(userProfile)}
          onPress={() => {
            triggerHaptic('light');
            navigation.navigate('UserProfile', { userId: userProfile.id });
          }}
          style={styles.userCard}
        >
          <View style={styles.userContent}>
            <View style={styles.userHeader}>
              <SafeAvatar
                size={60}
                source={userProfile.profileImage ? { uri: userProfile.profileImage } : undefined}
                fallbackText={userProfile.name}
                style={[styles.avatar, shadows.sm]}
              />
              <View style={styles.userInfo}>
                <Title style={styles.userName}>{userProfile.name}</Title>
                <View style={styles.locationRow}>
                  <IconButton icon="map-marker" size={16} iconColor={colors.neutral[600]} />
                  <Paragraph style={styles.locationText}>{userProfile.city}</Paragraph>
                </View>
                {userProfile.rating && userProfile.rating > 0 && (
                  <View style={styles.ratingRow}>
                    <IconButton icon="star" size={16} iconColor={colors.warning.main} />
                    <Text style={styles.ratingText}>
                      {userProfile.rating.toFixed(1)} ({userProfile.totalSessions || 0} sessions)
                    </Text>
                  </View>
                )}
              </View>
              {compatibilityScore > 0 && (
                <View style={[styles.compatibilityBadge, { backgroundColor: colors.success.light }]}>
                  <Text style={[styles.compatibilityText, { color: colors.success.dark }]}>
                    {compatibilityScore}%
                  </Text>
                  <Text style={[styles.compatibilityLabel, { color: colors.success.dark }]}>
                    match
                  </Text>
                </View>
              )}
            </View>

            {userProfile.bio && (
              <Paragraph style={styles.bio} numberOfLines={2}>
                {userProfile.bio}
              </Paragraph>
            )}

            {/* Skills sections (condensed for selection mode) */}
            {userProfile.skillsToTeach && userProfile.skillsToTeach.length > 0 && (
              <View style={styles.skillsSection}>
                <View style={styles.skillsHeader}>
                  <IconButton icon="account-voice" size={20} iconColor={colors.success.main} />
                  <Text style={[styles.skillsLabel, { color: colors.success.main }]}>Can teach</Text>
                </View>
                <View style={styles.skillsContainer}>
                  {userProfile.skillsToTeach.slice(0, 2).map((skill) => (
                    <Chip 
                      key={skill.id} 
                      style={[styles.teachChip, { backgroundColor: colors.success.light }]}
                      textStyle={{ color: colors.success.dark }}
                      compact
                    >
                      {skill.name}
                    </Chip>
                  ))}
                  {userProfile.skillsToTeach.length > 2 && (
                    <Chip style={styles.moreChip} compact>
                      +{userProfile.skillsToTeach.length - 2}
                    </Chip>
                  )}
                </View>
              </View>
            )}
          </View>
        </SelectableItem>
      );
    }

    return (
      <EnhancedCard
        variant="elevated"
        style={styles.userCard}
        onPress={() => {
          triggerHaptic('light');
          navigation.navigate('UserProfile', { userId: userProfile.id });
        }}
        animationEnabled={true}
      >
        <View style={styles.userContent}>
          <View style={styles.userHeader}>
            <SafeAvatar
              size={60}
              source={userProfile.profileImage ? { uri: userProfile.profileImage } : undefined}
              fallbackText={userProfile.name}
              style={[styles.avatar, shadows.sm]}
            />
            <View style={styles.userInfo}>
              <Title style={styles.userName}>{userProfile.name}</Title>
              <View style={styles.locationRow}>
                <IconButton icon="map-marker" size={16} iconColor={colors.neutral[600]} />
                <Paragraph style={styles.locationText}>{userProfile.city}</Paragraph>
              </View>
              {userProfile.rating && userProfile.rating > 0 && (
                <View style={styles.ratingRow}>
                  <IconButton icon="star" size={16} iconColor={colors.warning.main} />
                  <Text style={styles.ratingText}>
                    {userProfile.rating.toFixed(1)} ({userProfile.totalSessions || 0} sessions)
                  </Text>
                </View>
              )}
            </View>
            {compatibilityScore > 0 && (
              <View style={[styles.compatibilityBadge, { backgroundColor: colors.success.light }]}>
                <Text style={[styles.compatibilityText, { color: colors.success.dark }]}>
                  {compatibilityScore}%
                </Text>
                <Text style={[styles.compatibilityLabel, { color: colors.success.dark }]}>
                  match
                </Text>
              </View>
            )}
          </View>

          {userProfile.bio && (
            <Paragraph style={styles.bio} numberOfLines={2}>
              {userProfile.bio}
            </Paragraph>
          )}

          {/* Enhanced Skills Sections */}
          {userProfile.skillsToTeach && userProfile.skillsToTeach.length > 0 && (
            <View style={styles.skillsSection}>
              <View style={styles.skillsHeader}>
                <IconButton icon="account-voice" size={20} iconColor={colors.success.main} />
                <Text style={[styles.skillsLabel, { color: colors.success.main }]}>Can teach</Text>
              </View>
              <View style={styles.skillsContainer}>
                {userProfile.skillsToTeach.slice(0, 3).map((skill) => (
                  <Chip 
                    key={skill.id} 
                    style={[styles.teachChip, { backgroundColor: colors.success.light }]}
                    textStyle={{ color: colors.success.dark }}
                    compact
                  >
                    {skill.name}
                  </Chip>
                ))}
                {userProfile.skillsToTeach.length > 3 && (
                  <Chip style={styles.moreChip} compact>
                    +{userProfile.skillsToTeach.length - 3}
                  </Chip>
                )}
              </View>
            </View>
          )}

          {userProfile.skillsToLearn && userProfile.skillsToLearn.length > 0 && (
            <View style={styles.skillsSection}>
              <View style={styles.skillsHeader}>
                <IconButton icon="book-open-variant" size={20} iconColor={colors.primary.main} />
                <Text style={[styles.skillsLabel, { color: colors.primary.main }]}>Wants to learn</Text>
              </View>
              <View style={styles.skillsContainer}>
                {userProfile.skillsToLearn.slice(0, 3).map((skill) => (
                  <Chip 
                    key={skill.id} 
                    style={[styles.learnChip, { backgroundColor: colors.primary.light }]}
                    textStyle={{ color: colors.primary.dark }}
                    compact
                  >
                    {skill.name}
                  </Chip>
                ))}
                {userProfile.skillsToLearn.length > 3 && (
                  <Chip style={styles.moreChip} compact>
                    +{userProfile.skillsToLearn.length - 3}
                  </Chip>
                )}
              </View>
            </View>
          )}

          {/* Enhanced Action Buttons */}
          <View style={styles.actionButtons}>
            <EnhancedButton
              title={isFollowing[userProfile.id] ? "Following" : "Follow"}
              onPress={() => {
                triggerHaptic('medium');
                handleFollowToggle(userProfile.id);
              }}
              variant={isFollowing[userProfile.id] ? "outline" : "secondary"}
              size="small"
              icon={<IconButton icon={isFollowing[userProfile.id] ? "account-check" : "account-plus"} size={16} />}
              style={styles.actionButton}
            />
            <EnhancedButton
              title="Message"
              onPress={() => {
                triggerHaptic('light');
                const sortedIds = [user?.id, userProfile.id].sort();
                const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
                navigation.navigate('HomeChat', { 
                  chatId, 
                  otherUserId: userProfile.id 
                });
              }}
              variant="primary"
              size="small"
              icon={<IconButton icon="message" size={16} />}
              style={styles.actionButton}
            />
          </View>
        </View>
      </EnhancedCard>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingState
            variant="skeleton"
            text="Finding users..."
            style={styles.loadingState}
          />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }

    return (
      <EmptyState
        title={error ? "Search Error" : "No users found"}
        description={
          error
            ? `Error: ${error}. Please try again.`
            : filterType === 'all' 
              ? 'Try adjusting your search criteria or check back later for new users.'
              : filterType === 'teachers'
                ? 'No tutors found for the skills you want to learn. Try expanding your learning interests.'
                : 'No students found for the skills you can teach. Consider adding more teaching skills to your profile.'
        }
        icon={
          error 
            ? <IconButton icon="alert-circle" size={48} iconColor={colors.error.main} />
            : <IconButton icon="account-search" size={48} iconColor={colors.neutral[400]} />
        }
        action={
          error ? (
            <EnhancedButton
              title="Try Again"
              onPress={() => {
                triggerHaptic('light');
                loadUsers();
              }}
              variant="primary"
              size="medium"
            />
          ) : (
            <EnhancedButton
              title="Clear Filters"
              onPress={() => {
                triggerHaptic('light');
                setSearchQuery('');
                setFilterType('all');
              }}
              variant="outline"
              size="medium"
            />
          )
        }
        style={styles.emptyState}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search users or skills..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <SegmentedButtons
          value={filterType}
          onValueChange={setFilterType}
          buttons={[
            { value: 'all', label: 'All Users' },
            { 
              value: 'teachers', 
              label: 'Can Teach Me',
              disabled: !currentUser?.skillsToLearn || currentUser.skillsToLearn.length === 0
            },
            { 
              value: 'students', 
              label: 'Want to Learn',
              disabled: !currentUser?.skillsToTeach || currentUser.skillsToTeach.length === 0
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Users List */}
      <VirtualizedList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  segmentedButtons: {
    backgroundColor: 'white',
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  userCard: {
    marginVertical: spacing.sm,
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
  },
  userContent: {
    padding: spacing.lg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: colors.neutral[900],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationText: {
    ...typography.body2,
    color: colors.neutral[600],
    marginLeft: -spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.caption,
    color: colors.neutral[600],
    marginLeft: -spacing.xs,
  },
  compatibilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    alignItems: 'center',
    minWidth: 60,
  },
  compatibilityText: {
    ...typography.body2,
    fontWeight: 'bold',
  },
  compatibilityLabel: {
    ...typography.caption,
    fontSize: 10,
  },
  bio: {
    ...typography.body2,
    color: colors.neutral[700],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  skillsSection: {
    marginBottom: spacing.md,
  },
  skillsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  skillsLabel: {
    ...typography.body2,
    fontWeight: '600',
    marginLeft: -spacing.xs,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  teachChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  learnChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  moreChip: {
    backgroundColor: colors.neutral[200],
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.lg,
  },
  loadingState: {
    marginBottom: spacing.lg,
  },
  emptyState: {
    flex: 1,
    padding: spacing.xl,
  },
});

export default UserListScreen;
