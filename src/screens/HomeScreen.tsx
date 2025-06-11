import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Chip,
    FAB,
    Paragraph,
    Searchbar,
    Text,
    Title
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMatches } from '../store/slices/matchSlice';
import { fetchUserSkills } from '../store/slices/skillSlice';
import { fetchUserProfile } from '../store/slices/userSlice';
import { HomeStackParamList, TabParamList } from '../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'HomeMain'>,
  BottomTabNavigationProp<TabParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentUser, loading: userLoading } = useAppSelector((state) => state.user);
  const { skills, loading: skillsLoading } = useAppSelector((state) => state.skills);
  const { matches, loading: matchesLoading } = useAppSelector((state) => state.matches);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
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
      navigation.navigate('UserList', { skillId: searchQuery });
    }
  };

  const recentMatches = matches.slice(0, 3);
  const teachSkills = skills.filter(skill => skill.userId === user?.id);
  const learnSkills = currentUser?.skillsToLearn || [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <Avatar.Image 
                size={50} 
                source={{ uri: currentUser?.profileImage || 'https://via.placeholder.com/50' }}
              />
              <View style={styles.welcomeText}>
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

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{teachSkills.length}</Text>
              <Text style={styles.statLabel}>Skills to Teach</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{learnSkills.length}</Text>
              <Text style={styles.statLabel}>Skills to Learn</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{matches.length}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </Card.Content>
          </Card>
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

        {/* Getting Started */}
        {teachSkills.length === 0 && learnSkills.length === 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Title>Get Started</Title>
              <Paragraph>
                Add skills you can teach and skills you want to learn to start finding matches!
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('Profile')}
                style={styles.sectionButton}
              >
                Set Up Your Profile
              </Button>
            </Card.Content>
          </Card>
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
    marginBottom: 8,
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
  },
  statContent: {
    alignItems: 'center',
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
    margin: 16,
    marginTop: 8,
  },
  sectionButton: {
    marginTop: 8,
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen;
