// Enhanced HomeScreen with comprehensive optimizations
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  Card,
  Chip,
  FAB,
  Searchbar,
  Text,
  Title,
  useTheme
} from 'react-native-paper';
import ErrorBoundary from '../components/common/ErrorBoundary';
import SafeAvatar from '../components/SafeAvatar';
import EnhancedButton from '../components/ui/EnhancedButton';
import { ActionCard, StatCard } from '../components/ui/EnhancedCard';
import { EmptyState, SkeletonCard } from '../components/ui/LoadingState';
// Enhanced components and hooks
import RealTimeIndicators from '../components/realtime/RealTimeIndicators';
import { useAdvancedAnimation, useFadeAnimation, useScaleAnimation } from '../hooks/useAdvancedAnimation';
import { useEntranceAnimation } from '../hooks/useAnimation';
import useHapticFeedback from '../hooks/useHapticFeedback';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useOptimizedQuery } from '../hooks/useOptimizedQuery';
import { EnhancedApiService } from '../services/enhancedApiService';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMatches, findDynamicMatches } from '../store/slices/matchSlice';
import { fetchUserSkills } from '../store/slices/skillSlice';
import { fetchUserProfile } from '../store/slices/userSlice';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';
import { HomeStackParamList, TabParamList } from '../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'HomeMain'>,
  BottomTabNavigationProp<TabParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = React.memo(({ navigation }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { triggerHaptic } = useHapticFeedback();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser, loading: userLoading } = useAppSelector((state) => state.user);
  const { skills, loading: skillsLoading } = useAppSelector((state) => state.skills);
  const { matches, dynamicMatches, loading: matchesLoading } = useAppSelector((state) => state.matches);

  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);

  // Performance and UX hooks
  const { opacity, translateY } = useEntranceAnimation();
  const { animatedValue: pulseAnimation, animate } = useAdvancedAnimation(1);
  const { opacity: fadeOpacity, fadeIn } = useFadeAnimation(0);
  const { scale: scaleValue } = useScaleAnimation(1);
  const { syncData, isOnline, lastSyncTime } = useOfflineSync('home');

  // Optimized data fetching with caching
  const {
    data: homeData,
    isLoading: isLoadingHome,
    refetch: refetchHome
  } = useOptimizedQuery(
    ['home-data', user?.id],
    () => EnhancedApiService.get(`/users/${user?.id}/dashboard`),
    {
      enabled: !!user?.id,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Memoized calculations for better performance
  const teachSkills = useMemo(() => skills.filter(skill => skill.type === 'teach'), [skills]);
  const learnSkills = useMemo(() => skills.filter(skill => skill.type === 'learn'), [skills]);
  const recentMatches = useMemo(() => matches.slice(0, 3), [matches]);
  const totalMatches = useMemo(() => matches.length + dynamicMatches.length, [matches.length, dynamicMatches.length]);

  // Enhanced user display data with analytics
  const userDisplayData = useMemo(() => ({
    id: user?.id,
    name: user?.name || currentUser?.name || 'User',
    profileComplete: !!(currentUser?.bio && currentUser?.city && teachSkills.length > 0),
    skillsCount: skills.length,
    teachSkillsCount: teachSkills.length,
    learnSkillsCount: learnSkills.length,
    matchesCount: totalMatches,
    recentActivity: lastSyncTime,
  }), [user, currentUser, skills, teachSkills, learnSkills, totalMatches, lastSyncTime]);

  // Enhanced data loading with error handling and retry logic
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load core data with parallel requests
      await Promise.all([
        dispatch(fetchUserProfile(user.id)),
        dispatch(fetchUserSkills(user.id)),
        dispatch(fetchMatches(user.id))
      ]);

      // Load dynamic matches (can fail without affecting core functionality)
      try {
        await dispatch(findDynamicMatches({ userId: user.id }));
      } catch (dynamicError) {
        console.warn('Dynamic matches failed, continuing without them:', dynamicError);
      }

      // Sync offline data
      await syncData();
      
      setHasDataLoaded(true);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Trigger error recovery if available
      triggerHaptic('error');
    }
  }, [user?.id, dispatch, syncData, triggerHaptic]);

  // Enhanced refresh with better UX
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadUserData(),
        refetchHome()
      ]);
      triggerHaptic('success');
    } catch (error) {
      console.error('Refresh failed:', error);
      triggerHaptic('error');
    } finally {
      setRefreshing(false);
    }
  }, [loadUserData, refetchHome, triggerHaptic]);

  // Enhanced search with debouncing and haptic feedback
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      triggerHaptic('light');
      navigation.navigate('UserList', { skillId: searchQuery });
    }
  }, [searchQuery, triggerHaptic, navigation]);

  // Enhanced FAB press with animation
  const handleFABPress = useCallback(() => {
    triggerHaptic('medium');
    animate(1.1);
    navigation.navigate('UserList', {});
  }, [triggerHaptic, pulseAnimation, navigation]);

  // Load data on mount and user change
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id, loadUserData]);

  // Enhanced loading check
  const isActuallyLoading = (userLoading || skillsLoading || isLoadingHome) && !hasDataLoaded;

  // Enhanced icon renderer with memoization
  const renderIcon = useCallback((iconName: string, color: string, size: number = 24) => (
    <MaterialCommunityIcons 
      name={iconName as any} 
      size={size} 
      color={color} 
    />
  ), []);

  // Enhanced welcome message with personalization
  const getWelcomeMessage = useCallback(() => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const name = userDisplayData.name;
    
    if (!userDisplayData.profileComplete) {
      return `${greeting}, ${name}! Complete your profile to get better matches.`;
    }
    
    if (totalMatches === 0) {
      return `${greeting}, ${name}! Ready to discover new learning opportunities?`;
    }
    
    return `${greeting}, ${name}! You have ${totalMatches} potential matches waiting.`;
  }, [userDisplayData, totalMatches]);

  // Offline indicator
  if (!isOnline) {
    return (
      <View style={[styles.container, styles.offlineContainer]}>
        <RealTimeIndicators
          showOfflineIndicator={true}
          offlineMessage="You're offline. Some features may be limited."
        />
        <EmptyState
          title="You're offline"
          description="Connect to the internet for the full experience"
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
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        
        {/* Real-time indicators */}
        <RealTimeIndicators
          showOnlineStatus={true}
          userPresence="online"
        />

        <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Enhanced Welcome Section */}
            <LinearGradient
              colors={colors.gradient.primary}
              style={styles.welcomeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.welcomeContent}>
                <View style={styles.welcomeHeader}>
                  <View style={styles.welcomeText}>
                    <Text style={styles.welcomeGreeting}>
                      {getWelcomeMessage()}
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                      {isOnline ? 'Connected and ready to learn' : 'Working offline'}
                    </Text>
                  </View>
                  <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                    <SafeAvatar
                      size={50}
                      source={currentUser?.profileImage ? { uri: currentUser.profileImage } : undefined}
                      fallbackText={userDisplayData.name}
                      style={[styles.welcomeAvatar, shadows.md]}
                    />
                  </Animated.View>
                </View>
              </View>
            </LinearGradient>

            {/* Enhanced Search Section */}
            <Animated.View style={[styles.searchSection, { opacity }]}>
              <Searchbar
                placeholder="Search for skills or users..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                onSubmitEditing={handleSearch}
                style={[styles.searchbar, shadows.sm]}
                elevation={0}
                inputStyle={{ color: theme.colors.onSurface }}
                iconColor={theme.colors.primary}
              />
            </Animated.View>

            {/* Enhanced Quick Stats */}
            <Animated.View style={[styles.statsContainer, { transform: [{ scale: scaleValue }] }]}>
              <StatCard
                title="Teaching"
                value={teachSkills.length}
                icon={<MaterialCommunityIcons name="account-voice" size={24} color={colors.success.main} />}
                onPress={() => navigation.navigate('Profile')}
                style={styles.statCard}
                trend={{ value: teachSkills.length, isPositive: teachSkills.length > 0 }}
              />
              <StatCard
                title="Learning"
                value={learnSkills.length}
                icon={<MaterialCommunityIcons name="book-open-variant" size={24} color={colors.primary.main} />}
                onPress={() => navigation.navigate('Profile')}
                style={styles.statCard}
                trend={{ value: learnSkills.length, isPositive: learnSkills.length > 0 }}
              />
              <StatCard
                title="Matches"
                value={totalMatches}
                icon={<MaterialCommunityIcons name="heart" size={24} color={colors.error.main} />}
                onPress={() => navigation.navigate('Matches')}
                style={styles.statCard}
                trend={{ value: totalMatches, isPositive: totalMatches > 0 }}
              />
            </Animated.View>

            {/* Loading State */}
            {isActuallyLoading && (
              <View style={styles.loadingContainer}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}

            {/* Enhanced Recent Matches Section */}
            {!isActuallyLoading && totalMatches > 0 && (
              <Card style={styles.sectionCard}>
                <Card.Content style={styles.sectionContent}>
                  <Title style={styles.sectionTitle}>Recent Matches ({totalMatches})</Title>
                  {recentMatches.length > 0 ? (
                    recentMatches.map((match) => {
                      // Enhanced match data handling
                      const matchData = match as any;
                      const user1Id = typeof matchData.user1Id === 'object' ? matchData.user1Id.id || matchData.user1Id._id : matchData.user1Id;
                      const user2Id = typeof matchData.user2Id === 'object' ? matchData.user2Id.id || matchData.user2Id._id : matchData.user2Id;
                      const otherUserId = String(user1Id) === String(user?.id) ? user2Id : user1Id;
                      
                      return (
                        <ActionCard
                          key={match.id}
                          title={`New Match - ${match.compatibilityScore || 85}% compatible`}
                          description="Shared interests in learning and teaching"
                          icon={renderIcon("account-heart", colors.primary.main)}
                          onPress={() => {
                            triggerHaptic('light');
                            navigation.navigate('UserProfile', { userId: String(otherUserId) });
                          }}
                          style={styles.matchCard}
                        />
                      );
                    })
                  ) : (
                    dynamicMatches.slice(0, 3).map((match) => (
                      <ActionCard
                        key={`dynamic-${match.user.id}`}
                        title={`${match.user.name} - ${match.compatibilityScore}% match`}
                        description={`${match.sharedSkills.canTeach.length + match.sharedSkills.canLearnFrom.length} shared interests`}
                        icon={renderIcon("account-heart", colors.primary.main)}
                        onPress={() => {
                          triggerHaptic('light');
                          navigation.navigate('UserProfile', { userId: String(match.user.id) });
                        }}
                        style={styles.matchCard}
                      />
                    ))
                  )}
                  <EnhancedButton
                    title="View All Matches"
                    onPress={() => navigation.navigate('Matches')}
                    variant="outline"
                    size="medium"
                    style={styles.sectionButton}
                  />
                </Card.Content>
              </Card>
            )}

            {/* Skills to Teach Section */}
            {teachSkills.length > 0 && (
              <Card style={styles.sectionCard}>
                <Card.Content style={styles.sectionContent}>
                  <Title style={styles.sectionTitle}>Your Skills to Teach</Title>
                  <View style={styles.chipContainer}>
                    {teachSkills.slice(0, 5).map((skill) => (
                      <Chip 
                        key={`teach-${skill.id}`}
                        style={[styles.chip, { backgroundColor: colors.success.light }]}
                        textStyle={{ color: colors.success.dark }}
                      >
                        {skill.name}
                      </Chip>
                    ))}
                    {teachSkills.length > 5 && (
                      <Chip style={styles.moreChip}>
                        +{teachSkills.length - 5} more
                      </Chip>
                    )}
                  </View>
                  <EnhancedButton
                    title="Manage Skills"
                    onPress={() => navigation.navigate('Profile')}
                    variant="outline"
                    size="medium"
                    style={styles.sectionButton}
                  />
                </Card.Content>
              </Card>
            )}

            {/* Skills to Learn Section */}
            {learnSkills.length > 0 && (
              <Card style={styles.sectionCard}>
                <Card.Content style={styles.sectionContent}>
                  <Title style={styles.sectionTitle}>Skills You Want to Learn</Title>
                  <View style={styles.chipContainer}>
                    {learnSkills.slice(0, 5).map((skill) => (
                      <Chip 
                        key={`learn-${skill.id}`}
                        style={[styles.chip, { backgroundColor: colors.primary.light }]}
                        textStyle={{ color: colors.primary.dark }}
                      >
                        {skill.name}
                      </Chip>
                    ))}
                    {learnSkills.length > 5 && (
                      <Chip style={styles.moreChip}>
                        +{learnSkills.length - 5} more
                      </Chip>
                    )}
                  </View>
                  <EnhancedButton
                    title="Find Teachers"
                    onPress={() => navigation.navigate('UserList')}
                    variant="outline"
                    size="medium"
                    style={styles.sectionButton}
                  />
                </Card.Content>
              </Card>
            )}

            {/* Empty State */}
            {!isActuallyLoading && teachSkills.length === 0 && learnSkills.length === 0 && matches.length === 0 && (
              <EmptyState
                title="Welcome to SkillSwap!"
                description="Start by adding skills you can teach or want to learn"
                action={
                  <EnhancedButton
                    title="Add Your First Skill"
                    onPress={() => navigation.navigate('Profile')}
                    variant="primary"
                    size="large"
                  />
                }
                style={styles.emptyState}
              />
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <ActionCard
                title="Find Learning Partners"
                description="Browse available skills and connect with tutors"
                icon={renderIcon("magnify", colors.primary.main)}
                onPress={() => {
                  triggerHaptic('light');
                  navigation.navigate('UserList', {});
                }}
                style={styles.actionCard}
              />
              <ActionCard
                title="Manage Your Profile"
                description="Update your skills and preferences"
                icon={renderIcon("account-edit", colors.secondary.main)}
                onPress={() => {
                  triggerHaptic('light');
                  navigation.navigate('Profile');
                }}
                style={styles.actionCard}
              />
            </View>

            {/* Debug Section - Development only */}
            {__DEV__ && (
              <Card style={styles.sectionCard}>
                <Card.Content style={styles.sectionContent}>
                  <Title style={styles.sectionTitle}>Debug Info</Title>
                  <Text>User ID: {user?.id}</Text>
                  <Text>Skills: {skills.length}</Text>
                  <Text>Teaching: {teachSkills.length}</Text>
                  <Text>Learning: {learnSkills.length}</Text>
                  <Text>Matches: {matches.length}</Text>
                  <Text>Dynamic Matches: {dynamicMatches.length}</Text>
                  <Text>Loading States: User={userLoading ? 'Y' : 'N'}, Skills={skillsLoading ? 'Y' : 'N'}, Matches={matchesLoading ? 'Y' : 'N'}</Text>
                  <Text>Last Sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}</Text>
                </Card.Content>
              </Card>
            )}
          </ScrollView>

          {/* Enhanced FAB with animation */}
          <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
            <FAB
              style={styles.fab}
              icon="plus"
              onPress={handleFABPress}
              label="Find Users"
              color="white"
            />
          </Animated.View>
        </Animated.View>
      </View>
    </ErrorBoundary>
  );
});

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
  scrollView: {
    flex: 1,
  },
  welcomeGradient: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  welcomeContent: {
    padding: spacing.xl,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    flex: 1,
    marginRight: spacing.md,
  },
  welcomeGreeting: {
    ...typography.h2,
    color: 'white',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  welcomeAvatar: {
    borderWidth: 3,
    borderColor: 'white',
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchbar: {
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sectionContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.neutral[900],
  },
  sectionButton: {
    marginTop: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  moreChip: {
    backgroundColor: colors.neutral[200],
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  matchCard: {
    marginBottom: spacing.sm,
  },
  quickActions: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    backgroundColor: 'white',
  },
  emptyState: {
    padding: spacing.xl,
    marginHorizontal: spacing.md,
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
  },
});

export default HomeScreen;
