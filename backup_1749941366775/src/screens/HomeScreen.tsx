// Enhanced HomeScreen with performance optimizations and improved UX
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
  IconButton,
  Searchbar,
  Text,
  Title,
  useTheme
} from 'react-native-paper';
import SafeAvatar from '../components/SafeAvatar';
import EnhancedButton from '../components/ui/EnhancedButton';
import { ActionCard, StatCard } from '../components/ui/EnhancedCard';
import { EmptyState, SkeletonCard } from '../components/ui/LoadingState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import useHapticFeedback from '../hooks/useHapticFeedback';
import { useEntranceAnimation } from '../hooks/useAnimation';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { opacity, translateY } = useEntranceAnimation();

  // Add error handling for iOS-specific issues
  const [hasDataLoaded, setHasDataLoaded] = useState(false);

  // Memoized calculations for better performance
  const teachSkills = useMemo(() => skills.filter(skill => skill.type === 'teach'), [skills]);
  const learnSkills = useMemo(() => skills.filter(skill => skill.type === 'learn'), [skills]);
  const recentMatches = useMemo(() => matches.slice(0, 3), [matches]);
  const totalMatches = useMemo(() => matches.length + dynamicMatches.length, [matches.length, dynamicMatches.length]);

  // Memoized user display data
  const userDisplayData = useMemo(() => ({
    name: currentUser?.name || user?.name || 'User',
    avatar: currentUser?.profileImage,
    totalSessions: currentUser?.totalSessions || 0,
    rating: currentUser?.rating || 0,
  }), [currentUser, user]);

  useEffect(() => {
    // Mark data as loaded when we have at least user data or skills
    if (user?.id && (skills.length > 0 || !skillsLoading)) {
      setHasDataLoaded(true);
    }
  }, [user?.id, skills.length, skillsLoading]);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Load essential data first
      await Promise.all([
        dispatch(fetchUserProfile(user.id)),
        dispatch(fetchUserSkills(user.id)),
        dispatch(fetchMatches(user.id)),
      ]);

      // Load dynamic matches separately to avoid blocking the UI
      try {
        await dispatch(findDynamicMatches({ 
          userId: user.id, 
          filters: { minCompatibilityScore: 30 } 
        }));
      } catch (dynamicError) {
        console.warn('Dynamic matches failed, continuing without them:', dynamicError);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, [user?.id, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, [loadUserData]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      triggerHaptic('light');
      navigation.navigate('UserList', { skillId: searchQuery });
    }
  }, [searchQuery, triggerHaptic, navigation]);

  const handleFABPress = useCallback(() => {
    triggerHaptic('medium');
    navigation.navigate('UserList', {});
  }, [triggerHaptic, navigation]);

  // Enhanced loading check for iOS
  const isActuallyLoading = (userLoading || skillsLoading) && !hasDataLoaded;

  // Memoized render function for icons
  const renderIcon = useCallback((iconName: string, color: string, size: number = 24) => (
    <MaterialCommunityIcons name={iconName as any} size={size} color={color} />
  ), []);

  // Use effect for initial data loading
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id, loadUserData]);

  if (isActuallyLoading) {
    console.log('🔄 HomeScreen still loading:', { userLoading, skillsLoading, hasDataLoaded });
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <ScrollView style={styles.scrollView}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  // Debug logging with more detail
  console.log('🔍 HomeScreen Debug:', {
    userLoading,
    skillsLoading,
    matchesLoading,
    totalSkills: skills.length,
    teachSkills: teachSkills.length,
    learnSkills: learnSkills.length,
    matches: matches.length,
    dynamicMatches: dynamicMatches.length,
    skills: skills.map(s => ({ id: s.id, name: s.name, type: s.type })),
    recentMatches: recentMatches.length,
    showEmptyState: teachSkills.length === 0 && learnSkills.length === 0 && matches.length === 0,
    currentUser: currentUser ? { id: currentUser.id, name: currentUser.name } : null,
    user: user ? { id: user.id, name: user.name } : null
  });

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
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
                <SafeAvatar 
                  size={60} 
                  source={currentUser?.profileImage ? { uri: currentUser.profileImage } : undefined}
                  fallbackText={currentUser?.name || user?.name || 'U'}
                  style={[styles.avatar, shadows.md]}
                />
                <View style={styles.welcomeText}>
                  <Text style={styles.welcomeTitle}>
                    Welcome back!
                  </Text>
                  <Text style={styles.welcomeName}>
                    {currentUser?.name || user?.name || 'User'}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>
                    Ready to learn something new today?
                  </Text>
                </View>
                <IconButton
                  icon="bell-outline"
                  iconColor="white"
                  size={24}
                  onPress={() => triggerHaptic('light')}
                />
              </View>
            </View>
          </LinearGradient>

          {/* Enhanced Search Section */}
          <View style={styles.searchSection}>
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
          </View>

          {/* Enhanced Quick Stats */}
          <View style={styles.statsContainer}>
            <StatCard
              title="Teaching"
              value={teachSkills.length}
              icon={<MaterialCommunityIcons name="account-voice" size={24} color={colors.success.main} />}
              onPress={() => navigation.navigate('Profile')}
              style={styles.statCard}
            />
            <StatCard
              title="Learning"
              value={learnSkills.length}
              icon={<MaterialCommunityIcons name="book-open-variant" size={24} color={colors.primary.main} />}
              onPress={() => navigation.navigate('Profile')}
              style={styles.statCard}
            />
            <StatCard
              title="Matches"
              value={matches.length + dynamicMatches.length}
              icon={<MaterialCommunityIcons name="heart" size={24} color={colors.secondary.main} />}
              onPress={() => navigation.navigate('Matches')}
              style={styles.statCard}
            />
          </View>

          {/* Recent Matches Section - Show both existing and dynamic matches */}
          {(recentMatches.length > 0 || dynamicMatches.length > 0) && (
            <Card style={styles.sectionCard}>
              <Card.Content style={styles.sectionContent}>
                <Title style={styles.sectionTitle}>
                  {recentMatches.length > 0 ? 'Recent Matches' : 'Potential Matches'}
                </Title>
                {recentMatches.length > 0 ? (
                  recentMatches.map((match) => (
                    <ActionCard
                      key={`match-${match.id}`}
                      title={`Match found!`}
                      description={`Compatibility score: ${match.compatibilityScore}%`}
                      icon={renderIcon("heart", colors.secondary.main)}
                      onPress={() => {
                        triggerHaptic('light');
                        // Handle populated user data in matches
                        const matchData = match as any;
                        const user1Id = typeof matchData.user1Id === 'object' ? matchData.user1Id.id || matchData.user1Id._id : matchData.user1Id;
                        const user2Id = typeof matchData.user2Id === 'object' ? matchData.user2Id.id || matchData.user2Id._id : matchData.user2Id;
                        const otherUserId = String(user1Id) === String(user?.id) ? user2Id : user1Id;
                        
                        navigation.navigate('UserProfile', { 
                          userId: String(otherUserId)
                        });
                      }}
                      style={styles.matchCard}
                    />
                  ))
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
                    <Chip key="teach-more" style={styles.chip}>
                      +{teachSkills.length - 5} more
                    </Chip>
                  )}
                </View>
                <EnhancedButton
                  title="Manage Teaching Skills"
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
                    <Chip key="learn-more" style={styles.chip}>
                      +{learnSkills.length - 5} more
                    </Chip>
                  )}
                </View>
                <EnhancedButton
                  title="Manage Learning Goals"
                  onPress={() => navigation.navigate('Profile')}
                  variant="outline"
                  size="medium"
                  style={styles.sectionButton}
                />
              </Card.Content>
            </Card>
          )}

          {/* Empty State - only show when user truly has no content */}
          {teachSkills.length === 0 && learnSkills.length === 0 && matches.length === 0 && (
            <EmptyState
              title="Welcome to SkillSwap!"
              description="Start your learning journey by adding some skills to your profile. You can teach others and learn new skills."
              icon={renderIcon("account-plus", colors.primary.main, 48)}
              action={
                <EnhancedButton
                  title="Add Your First Skill"
                  onPress={() => {
                    triggerHaptic('medium');
                    navigation.navigate('Profile');
                  }}
                  variant="primary"
                  size="large"
                />
              }
              style={styles.emptyState}
            />
          )}

          {/* Quick Actions - Always show for easy access */}
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

          {/* Debug Section - Remove in production */}
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
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={handleFABPress}
          label="Find Users"
          color="white"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  scrollView: {
    flex: 1,
  },
  welcomeGradient: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  welcomeContent: {
    padding: spacing.lg,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  welcomeTitle: {
    ...typography.h3,
    color: 'white',
    fontWeight: '600',
  },
  welcomeName: {
    ...typography.h2,
    color: 'white',
    fontWeight: 'bold',
    marginVertical: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  avatar: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  },
  sectionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sectionContent: {
    padding: spacing.lg,
  },
  sectionButton: {
    marginTop: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    marginVertical: spacing.xs / 2,
  },
  matchCard: {
    marginBottom: spacing.sm,
  },
  emptyState: {
    margin: spacing.lg,
  },
  quickActions: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  actionCard: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.neutral[800],
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
  },
});

export default HomeScreen;
