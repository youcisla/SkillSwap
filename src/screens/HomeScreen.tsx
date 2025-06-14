import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Animated,
  StatusBar,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  FAB,
  Paragraph,
  Searchbar,
  Text,
  Title,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import SafeAvatar from '../components/SafeAvatar';
import EnhancedCard, { StatCard, ActionCard } from '../components/ui/EnhancedCard';
import EnhancedButton from '../components/ui/EnhancedButton';
import LoadingState, { SkeletonCard, EmptyState } from '../components/ui/LoadingState';
import useHapticFeedback from '../hooks/useHapticFeedback';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMatches } from '../store/slices/matchSlice';
import { fetchUserSkills } from '../store/slices/skillSlice';
import { fetchUserProfile } from '../store/slices/userSlice';
import { HomeStackParamList, TabParamList } from '../types';
import { colors, spacing, shadows, borderRadius } from '../theme';

type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'HomeMain'>,
  BottomTabNavigationProp<TabParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { triggerHaptic } = useHapticFeedback();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser, loading: userLoading } = useAppSelector((state) => state.user);
  const { skills, loading: skillsLoading } = useAppSelector((state) => state.skills);
  const { matches, loading: matchesLoading } = useAppSelector((state) => state.matches);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (user?.id) {
      loadUserData();
      // Animate entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      await Promise.all([
        dispatch(fetchUserProfile(user.id)),
        dispatch(fetchUserSkills(user.id)),
        dispatch(fetchMatches(user.id)),
      ]);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      triggerHaptic('light');
      navigation.navigate('UserList', { skillId: searchQuery });
    }
  };

  const handleFABPress = () => {
    triggerHaptic('medium');
    navigation.navigate('UserList', {});
  };

  if (userLoading || skillsLoading) {
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

  const recentMatches = matches.slice(0, 3);
  const teachSkills = skills.filter(skill => skill.type === 'teach');
  const learnSkills = skills.filter(skill => skill.type === 'learn');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
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
              icon={<IconButton icon="teach" size={24} iconColor={colors.success.main} />}
              onPress={() => navigation.navigate('Profile')}
              style={styles.statCard}
            />
            <StatCard
              title="Learning"
              value={learnSkills.length}
              icon={<IconButton icon="school" size={24} iconColor={colors.primary.main} />}
              onPress={() => navigation.navigate('Profile')}
              style={styles.statCard}
            />
            <StatCard
              title="Matches"
              value={matches.length}
              icon={<IconButton icon="heart" size={24} iconColor={colors.secondary.main} />}
              onPress={() => navigation.navigate('Matches')}
              style={styles.statCard}
            />
          </View>
                <Title>Welcome back, {currentUser?.name || user?.name}!</Title>
                <Paragraph>{currentUser?.city}</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search for skills or users..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchbar}
          />
        </View>

        {/* Enhanced Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Teaching"
            value={teachSkills.length}
            icon={<IconButton icon="teach" size={24} iconColor={colors.success.main} />}
            onPress={() => navigation.navigate('Profile')}
            style={styles.statCard}
          />
          <StatCard
            title="Learning"
            value={learnSkills.length}
            icon={<IconButton icon="school" size={24} iconColor={colors.primary.main} />}
            onPress={() => navigation.navigate('Profile')}
            style={styles.statCard}
          />
          <StatCard
            title="Matches"
            value={matches.length}
            icon={<IconButton icon="heart" size={24} iconColor={colors.secondary.main} />}
            onPress={() => navigation.navigate('Matches')}
            style={styles.statCard}
          />
        </View>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title>Recent Matches</Title>
              {recentMatches.map((match) => (
                <View key={match.id} style={styles.matchItem}>
                  <Text>Match with compatibility score: {match.compatibilityScore}%</Text>
                  <Button 
                    mode="outlined" 
                    compact
                    onPress={() => navigation.navigate('UserProfile', { userId: match.user1Id === user?.id ? match.user2Id : match.user1Id })}
                  >
                    View Profile
                  </Button>
                </View>
              ))}
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Matches')}
                style={styles.sectionButton}
              >
                View All Matches
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Skills to Teach */}
        {teachSkills.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title>Your Skills to Teach</Title>
              <View style={styles.chipContainer}>
                {teachSkills.slice(0, 5).map((skill) => (
                  <Chip key={skill.id} style={styles.chip}>
                    {skill.name}
                  </Chip>
                ))}
              </View>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Profile')}
                style={styles.sectionButton}
              >
                Manage Skills
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Skills to Learn */}
        {learnSkills.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title>Skills You Want to Learn</Title>
              <View style={styles.chipContainer}>
                {learnSkills.slice(0, 5).map((skill) => (
                  <Chip key={skill.id} style={styles.chip}>
                    {skill.name}
                  </Chip>
                ))}
              </View>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Profile')}
                style={styles.sectionButton}
              >
                Manage Skills
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {teachSkills.length === 0 && learnSkills.length === 0 && matches.length === 0 && (
          <EmptyState
            title="Get Started with SkillSwap"
            description="Welcome! Add some skills to your profile to start finding people to exchange knowledge with."
            icon={<IconButton icon="account-plus" size={48} iconColor={colors.primary.main} />}
            action={
              <EnhancedButton
                title="Add Your First Skill"
                onPress={() => navigation.navigate('Profile')}
                variant="primary"
                size="large"
              />
            }
          />
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('UserList', {})}
        label="Find Users"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    margin: 16,
    elevation: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchbar: {
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    margin: 2,
  },
  sectionButton: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen;
