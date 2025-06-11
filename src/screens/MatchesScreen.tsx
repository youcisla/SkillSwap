import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
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
    Title,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMatches } from '../store/slices/matchSlice';
import { Match, RootStackParamList } from '../types';

type MatchesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Matches'>;

interface Props {
  navigation: MatchesScreenNavigationProp;
}

const MatchesScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { matches, loading } = useAppSelector((state) => state.matches);
  const { users } = useAppSelector((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadMatches();
    }
  }, [user?.id]);

  const loadMatches = async () => {
    if (!user?.id) return;
    
    try {
      await dispatch(fetchMatches(user.id)).unwrap();
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const getMatchedUser = (match: Match) => {
    const otherUserId = match.user1Id === user?.id ? match.user2Id : match.user1Id;
    return users.find(u => u.id === otherUserId);
  };

  const getMatchedSkills = (match: Match) => {
    return match.user1Id === user?.id ? match.user1Skills : match.user2Skills;
  };

  const filteredMatches = matches.filter(match => {
    if (!searchQuery) return true;
    
    const matchedUser = getMatchedUser(match);
    const matchedSkills = getMatchedSkills(match);
    
    return (
      matchedUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      matchedSkills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const renderMatchCard = ({ item }: { item: Match }) => {
    const matchedUser = getMatchedUser(item);
    const matchedSkills = getMatchedSkills(item);

    if (!matchedUser) return null;

    return (
      <Card style={styles.matchCard}>
        <Card.Content>
          <View style={styles.matchHeader}>
            <View style={styles.userInfo}>
              <Avatar.Image 
                size={60} 
                source={{ uri: matchedUser.profileImage || 'https://via.placeholder.com/60' }}
              />
              <View style={styles.userDetails}>
                <Title style={styles.userName}>{matchedUser.name}</Title>
                <Text style={styles.userLocation}>{matchedUser.city}</Text>
                <View style={styles.compatibilityContainer}>
                  <Text style={styles.compatibilityLabel}>Match: </Text>
                  <Chip 
                    style={[
                      styles.compatibilityChip,
                      { backgroundColor: getCompatibilityColor(item.compatibilityScore) }
                    ]}
                    textStyle={styles.compatibilityText}
                  >
                    {item.compatibilityScore}%
                  </Chip>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>Matched Skills:</Text>
            <View style={styles.skillsContainer}>
              {matchedSkills.map((skill, index) => (
                <Chip key={index} style={styles.skillChip}>
                  {skill}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.matchActions}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('MatchUserProfile', { userId: matchedUser.id })}
              style={styles.actionButton}
            >
              View Profile
            </Button>
            <Button 
              mode="contained" 
              onPress={() => handleStartChat(matchedUser.id)}
              style={styles.actionButton}
            >
              Start Chat
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!user?.id) return;
    
    try {
      // In a real app, you'd create or find existing chat
      const chatId = `${user.id}-${otherUserId}`;
      navigation.navigate('Chat', { chatId, otherUserId });
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Paragraph style={styles.emptyText}>
        Add more skills to your profile to find better matches!
      </Paragraph>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('ProfileMain', { userId: undefined })}
        style={styles.emptyButton}
      >
        Update Profile
      </Button>
    </View>
  );

  if (loading && matches.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Finding your matches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search matches..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={filteredMatches}
        renderItem={renderMatchCard}
        keyExtractor={(item) => item.id}
        style={styles.matchesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredMatches.length === 0 ? styles.emptyListContainer : undefined}
      />

      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={loadMatches}
        label="Refresh"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchbar: {
    elevation: 2,
  },
  matchesList: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
  },
  matchCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
  },
  matchHeader: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  compatibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatibilityLabel: {
    fontSize: 14,
    color: '#666',
  },
  compatibilityChip: {
    marginLeft: 4,
  },
  compatibilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    margin: 2,
    backgroundColor: '#e3f2fd',
  },
  matchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MatchesScreen;
