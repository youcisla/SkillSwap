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
import EnhancedCard from '../components/ui/EnhancedCard';
import LoadingState, { EmptyState, SkeletonCard } from '../components/ui/LoadingState';
import { SelectableItem } from '../components/ui/MultiSelection';
// Enhanced components and hooks for performance optimization
import { VirtualizedList } from '../components/optimized/VirtualizedList';
import { useAdvancedAnimation } from '../hooks/useAdvancedAnimation';
import useHapticFeedback from '../hooks/useHapticFeedback';
import { useMultiSelection } from '../hooks/useMultiSelection';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useOptimizedQuery } from '../hooks/useOptimizedQuery';
import { EnhancedApiService } from '../services/enhancedApiService';
import { useAppDispatch, useAppSelector } from '../store';
import { checkFollowStatus, followUser, unfollowUser } from '../store/slices/followSlice';
import { searchUsers } from '../store/slices/userSlice';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { HomeStackParamList, UserProfile } from '../types';

// Debounce hook for performance optimization
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

  // Enhanced state management with performance optimizations
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Virtualization and animation hooks
  const { animatedValue: fadeIn } = useAdvancedAnimation();
  
  // Offline sync for better reliability
  const { syncData, isOnline } = useOfflineSync('users');

  // Multi-selection hook for enhanced UX
  const userSelection = useMultiSelection<UserProfile>(
    (user) => user.id,
    { allowSelectAll: true }
  );

  const initialSkillId = route.params?.skillId;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Enhanced data fetching with caching
  const {
    data: optimizedUsers,
    isLoading: isLoadingOptimized,
    refetch: refetchUsers,
    error: queryError
  } = useOptimizedQuery(
    ['users', debouncedSearchQuery, filterType],
    () => EnhancedApiService.searchUsers({
      query: debouncedSearchQuery,
      filter: filterType,
      currentUserId: user?.id || null
    }),
    {
      enabled: !!user?.id && typeof user.id === 'string' && user.id.trim().length > 0, // Enhanced validation
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Load users when debounced search query or filter changes
  useEffect(() => {
    if (currentUser && user?.id && typeof user.id === 'string' && user.id.trim().length > 0) {
      loadUsers();
    }
  }, [debouncedSearchQuery, filterType, currentUser?.id, user?.id]);

  const loadUsers = useCallback(async () => {
    if (!user?.id || typeof user.id !== 'string' || user.id.trim().length === 0) {
      console.warn('Invalid user ID, skipping user search:', user?.id);
      return;
    }
    
    try {
      const filters: any = {};
      
      // Only add filters if they have valid values
      if (initialSkillId) {
        filters.skillId = initialSkillId;
      }
      
      if (user?.id) {
        filters.currentUserId = user.id;
      }
      
      if (debouncedSearchQuery.trim()) {
        await dispatch(searchUsers({
          query: debouncedSearchQuery,
          filters
        })).unwrap();
      } else {
        await dispatch(searchUsers({
          query: '',
          filters
        })).unwrap();
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [debouncedSearchQuery, initialSkillId, user?.id, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadUsers(),
        syncData(), // Sync offline data
        refetchUsers() // Refresh cached data
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadUsers, syncData, refetchUsers]);

  const handleFollowToggle = useCallback(async (userId: string) => {
    if (!user?.id) return;
    
    try {
      triggerHaptic('medium');
      if (isFollowing[userId]) {
        await dispatch(unfollowUser(userId)).unwrap();
      } else {
        await dispatch(followUser(userId)).unwrap();
      }
      // Refresh follow status
      await dispatch(checkFollowStatus(userId));
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  }, [user?.id, isFollowing, dispatch, triggerHaptic]);

  // Enhanced filtering with performance optimization
  const filteredUsers = React.useMemo(() => {
    if (!users || users.length === 0) return [];
    
    const filtered = users.filter(userProfile => {
      if (!userProfile || userProfile.id === user?.id) return false;

      // Search filter
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesName = userProfile.name?.toLowerCase().includes(query);
        const matchesCity = userProfile.city?.toLowerCase().includes(query);
        const matchesSkills = userProfile.skillsToTeach?.some(skill => 
          skill.name?.toLowerCase().includes(query)
        ) || userProfile.skillsToLearn?.some(skill => 
          skill.name?.toLowerCase().includes(query)
        );
        
        if (!matchesName && !matchesCity && !matchesSkills) {
          return false;
        }
      }

      // Type filter with enhanced logic
      if (filterType === 'teachers' && currentUser?.skillsToLearn) {
        const hasMatchingSkills = currentUser.skillsToLearn.some(learnSkill =>
          userProfile.skillsToTeach?.some(teachSkill => 
            teachSkill.name === learnSkill.name
          )
        );
        return hasMatchingSkills;
      } else if (filterType === 'students' && currentUser?.skillsToTeach) {
        const hasMatchingSkills = currentUser.skillsToTeach.some(teachSkill =>
          userProfile.skillsToLearn?.some(learnSkill => 
            learnSkill.name === teachSkill.name
          )
        );
        return hasMatchingSkills;
      }

      return true;
    });

    return filtered;
  }, [users, user?.id, debouncedSearchQuery, filterType, currentUser]);

  // Enhanced compatibility calculation
  const calculateCompatibility = useCallback((userProfile: UserProfile): number => {
    if (!currentUser?.skillsToTeach || !currentUser?.skillsToLearn) return 0;
    
    const teachMatches = currentUser.skillsToTeach.filter(teachSkill =>
      userProfile.skillsToLearn?.some(learnSkill => learnSkill.name === teachSkill.name)
    ).length;
    
    const learnMatches = currentUser.skillsToLearn.filter(learnSkill =>
      userProfile.skillsToTeach?.some(teachSkill => teachSkill.name === learnSkill.name)
    ).length;
    
    const totalPossibleMatches = Math.max(
      currentUser.skillsToTeach.length + currentUser.skillsToLearn.length,
      (userProfile.skillsToTeach?.length || 0) + (userProfile.skillsToLearn?.length || 0),
      1
    );
    
    return Math.round(((teachMatches + learnMatches) / totalPossibleMatches) * 100);
  }, [currentUser]);

  // Enhanced render function with animations and better UX
  const renderUserItem = useCallback(({ item: userProfile }: { item: UserProfile }) => {
    const compatibilityScore = calculateCompatibility(userProfile);
    const isSelected = userSelection.isSelected(userProfile);

    // Selection mode rendering
    if (isSelectionMode) {
      return (
        <SelectableItem
          key={userProfile.id}
          isSelected={isSelected}
          onToggleSelection={() => {
            userSelection.toggleSelection(userProfile);
          }}
          style={StyleSheet.flatten([
            styles.userCard, 
            isSelected && styles.selectedCard
          ])}
        >
          <View style={styles.userContent}>
            <View style={styles.userHeader}>
              <SafeAvatar
                size={50}
                source={userProfile.profileImage ? { uri: userProfile.profileImage } : undefined}
                fallbackText={userProfile.name}
                style={[styles.avatar, shadows.sm]}
              />
              <View style={styles.userInfo}>
                <Title style={styles.userName}>{userProfile.name}</Title>
                <View style={styles.locationRow}>
                  <IconButton icon="map-marker" size={14} iconColor={colors.neutral[600]} />
                  <Paragraph style={styles.locationText}>{userProfile.city}</Paragraph>
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
                  {userProfile.skillsToTeach.slice(0, 2).map((skill, index) => (
                    <Chip 
                      key={skill?.id || skill?.name || `teach-skill-${userProfile.id}-${index}`} 
                      style={[styles.teachChip, { backgroundColor: colors.success.light }]}
                      textStyle={{ color: colors.success.dark }}
                      compact
                    >
                      {skill?.name || 'Unknown Skill'}
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
        style={StyleSheet.flatten([
          styles.userCard, 
          { transform: [{ scale: fadeIn }] }
        ])}
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
                {userProfile.skillsToTeach.slice(0, 3).map((skill, index) => (
                  <Chip 
                    key={skill?.id || skill?.name || `teach-skill-${userProfile.id}-${index}`} 
                    style={[styles.teachChip, { backgroundColor: colors.success.light }]}
                    textStyle={{ color: colors.success.dark }}
                    compact
                  >
                    {skill?.name || 'Unknown Skill'}
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
                {userProfile.skillsToLearn.slice(0, 3).map((skill, index) => (
                  <Chip 
                    key={skill?.id || skill?.name || `learn-skill-${userProfile.id}-${index}`} 
                    style={[styles.learnChip, { backgroundColor: colors.primary.light }]}
                    textStyle={{ color: colors.primary.dark }}
                    compact
                  >
                    {skill?.name || 'Unknown Skill'}
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
              icon={isFollowing[userProfile.id] ? "account-check" : "account-plus"}
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
              icon="message"
              style={styles.actionButton}
            />
          </View>
        </View>
      </EnhancedCard>
    );
  }, [calculateCompatibility, userSelection, isSelectionMode, fadeIn, triggerHaptic, navigation, isFollowing, handleFollowToggle, user?.id]);

  // Enhanced empty state with better messaging
  const renderEmptyState = () => {
    if (loading || isLoadingOptimized) {
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
        title={error || queryError ? "Search Error" : "No users found"}
        description={
          error || queryError
            ? "There was an error loading users. Please try again."
            : debouncedSearchQuery
            ? `No users found matching "${debouncedSearchQuery}"`
            : filterType === 'teachers'
            ? "No users can teach the skills you want to learn"
            : filterType === 'students'
            ? "No users want to learn the skills you can teach"
            : "No users available at the moment"
        }
        action={
          <EnhancedButton
            title={error || queryError ? "Retry" : "Refresh"}
            onPress={onRefresh}
            variant="outline"
            size="medium"
          />
        }
        style={styles.emptyState}
      />
    );
  };

  // Show offline indicator
  if (!isOnline) {
    return (
      <View style={[styles.container, styles.offlineContainer]}>
        <EmptyState
          title="You're offline"
          description="Connect to the internet to find users"
          action={
            <EnhancedButton
              title="Retry"
              onPress={onRefresh}
              variant="primary"
              size="medium"
            />
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Search Section */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search users, skills, or locations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ fontSize: 16 }}
          iconColor={theme.colors.primary}
        />
      </View>

      {/* Enhanced Filter Section */}
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

      {/* Optimized Users List with Virtualization */}
      <VirtualizedList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item: UserProfile) => item.id}
        estimatedItemSize={120}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        windowSize={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  offlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.surface,
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
    marginLeft: -spacing.xs,
  },
  ratingText: {
    ...typography.body2,
    color: colors.neutral[600],
    marginLeft: -spacing.xs,
  },
  compatibilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    minWidth: 60,
  },
  compatibilityText: {
    ...typography.h6,
    fontWeight: '700',
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
    marginBottom: spacing.sm,
  },
  skillsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginLeft: -spacing.xs,
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
