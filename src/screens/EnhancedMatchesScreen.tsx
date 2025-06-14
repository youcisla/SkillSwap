import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Button,
    Card,
    Chip,
    FAB,
    IconButton,
    Paragraph,
    Searchbar,
    SegmentedButtons,
    Text,
    Title,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMatches, findDynamicMatches } from '../store/slices/matchSlice';
import { colors, spacing } from '../theme';
import { Match, MatchesStackParamList } from '../types';

type MatchesScreenNavigationProp = StackNavigationProp<MatchesStackParamList, 'MatchesMain'>;

interface Props {
  navigation: MatchesScreenNavigationProp;
}

const EnhancedMatchesScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { matches, dynamicMatches, loading, dynamicLoading } = useAppSelector((state) => state.matches);
  const { users } = useAppSelector((state) => state.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('dynamic'); // 'existing' or 'dynamic'
  const [compatibilityFilter, setCompatibilityFilter] = useState(30);

  useEffect(() => {
    if (user?.id) {
      loadMatches();
      loadDynamicMatches();
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

  const loadDynamicMatches = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔍 Loading dynamic matches...');
      await dispatch(findDynamicMatches({
        userId: user.id,
        filters: {
          minCompatibilityScore: compatibilityFilter,
          maxDistance: 50,
        }
      })).unwrap();
    } catch (error) {
      console.error('Failed to load dynamic matches:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (viewMode === 'existing') {
      await loadMatches();
    } else {
      await loadDynamicMatches();
    }
    setRefreshing(false);
  };

  const getMatchedUser = (match: Match) => {
    const otherUserId = match.user1Id === user?.id ? match.user2Id : match.user1Id;
    return users.find(u => u.id === otherUserId);
  };

  const getMatchedSkills = (match: Match) => {
    return match.user1Id === user?.id ? match.user1Skills : match.user2Skills;
  };

  const filteredExistingMatches = matches.filter(match => {
    if (!searchQuery) return true;
    
    const matchedUser = getMatchedUser(match);
    const matchedSkills = getMatchedSkills(match);
    
    return (
      matchedUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      matchedSkills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredDynamicMatches = dynamicMatches.filter(match => {
    if (!searchQuery) return true;
    
    return (
      match.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.sharedSkills.canTeach.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      match.sharedSkills.canLearnFrom.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const renderExistingMatchCard = ({ item }: { item: Match }) => {
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
                    style={[styles.compatibilityChip, { backgroundColor: getCompatibilityColor(item.compatibilityScore) }]}
                    textStyle={styles.compatibilityText}
                  >
                    {item.compatibilityScore}%
                  </Chip>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>Shared Skills</Text>
            <View style={styles.skillsContainer}>
              {matchedSkills.slice(0, 3).map((skill, index) => (
                <Chip key={index} style={styles.skillChip}>
                  {skill}
                </Chip>
              ))}
              {matchedSkills.length > 3 && (
                <Text style={styles.moreSkills}>
                  +{matchedSkills.length - 3} more
                </Text>
              )}
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
              onPress={() => handleStartChat(item.id, matchedUser.id)}
              style={styles.actionButton}
            >
              Start Chat
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDynamicMatchCard = ({ item }: { item: any }) => {
    return (
      <Card style={styles.matchCard}>
        <Card.Content>
          <View style={styles.matchHeader}>
            <View style={styles.userInfo}>
              <Avatar.Image 
                size={60} 
                source={{ uri: item.user.profileImage || 'https://via.placeholder.com/60' }}
              />
              <View style={styles.userDetails}>
                <Title style={styles.userName}>{item.user.name}</Title>
                <Text style={styles.userLocation}>
                  {item.user.city}
                  {item.distance && ` • ${item.distance}km away`}
                </Text>
                <View style={styles.compatibilityContainer}>
                  <Text style={styles.compatibilityLabel}>Compatibility: </Text>
                  <Chip 
                    style={[styles.compatibilityChip, { backgroundColor: getCompatibilityColor(item.compatibilityScore) }]}
                    textStyle={styles.compatibilityText}
                  >
                    {item.compatibilityScore}%
                  </Chip>
                </View>
              </View>
            </View>
          </View>

          {/* Show what they can teach and learn */}
          {item.sharedSkills.canTeach.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.skillsTitle}>You can teach them:</Text>
              <View style={styles.skillsContainer}>
                {item.sharedSkills.canTeach.map((skill: string, index: number) => (
                  <Chip key={index} style={[styles.skillChip, { backgroundColor: colors.success.light }]}>
                    <Text style={{ color: colors.success.dark }}>{skill}</Text>
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {item.sharedSkills.canLearnFrom.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.skillsTitle}>You can learn from them:</Text>
              <View style={styles.skillsContainer}>
                {item.sharedSkills.canLearnFrom.map((skill: string, index: number) => (
                  <Chip key={index} style={[styles.skillChip, { backgroundColor: colors.primary.light }]}>
                    <Text style={{ color: colors.primary.dark }}>{skill}</Text>
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <View style={styles.matchActions}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('MatchUserProfile', { userId: item.user.id })}
              style={styles.actionButton}
            >
              View Profile
            </Button>
            <Button 
              mode="contained" 
              onPress={() => handleConnectWithUser(item.user.id)}
              style={styles.actionButton}
            >
              Connect
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return colors.success.main;
    if (score >= 60) return colors.warning.main;
    return colors.error.main;
  };

  const handleStartChat = async (matchId: string, otherUserId: string) => {
    const sortedIds = [user?.id, otherUserId].sort();
    const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
    try {
      navigation.navigate('MatchChat', { chatId, otherUserId });
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const handleConnectWithUser = async (otherUserId: string) => {
    try {
      // Create a match in the database
      if (user?.id) {
        const dynamicMatch = dynamicMatches.find(m => m.user.id === otherUserId);
        if (dynamicMatch) {
          // Add logic to create actual match or start conversation
          const sortedIds = [user.id, otherUserId].sort();
          const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
          navigation.navigate('MatchChat', { chatId, otherUserId });
        }
      }
    } catch (error) {
      console.error('Failed to connect with user:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="account-search" size={64} iconColor={colors.neutral[400]} />
      <Text style={styles.emptyTitle}>
        {viewMode === 'existing' ? 'No existing matches' : 'No potential matches found'}
      </Text>
      <Paragraph style={styles.emptyText}>
        {viewMode === 'existing' 
          ? 'Connect with people from the discover tab to create matches!'
          : 'Add more skills to your profile or adjust the compatibility filter to find better matches!'
        }
      </Paragraph>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('MatchUserProfile', { userId: user?.id })}
        style={styles.emptyButton}
      >
        Update Profile
      </Button>
    </View>
  );

  const isLoading = (viewMode === 'existing' ? loading : dynamicLoading) && 
                   (viewMode === 'existing' ? matches.length === 0 : dynamicMatches.length === 0);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>
          {viewMode === 'existing' ? 'Loading your matches...' : 'Finding potential matches...'}
        </Text>
      </View>
    );
  }

  const currentMatches = viewMode === 'existing' ? filteredExistingMatches : filteredDynamicMatches;
  const renderItem = viewMode === 'existing' ? renderExistingMatchCard : renderDynamicMatchCard;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            {
              value: 'dynamic',
              label: `Discover (${dynamicMatches.length})`,
              icon: 'account-search',
            },
            {
              value: 'existing',
              label: `My Matches (${matches.length})`,
              icon: 'heart',
            },
          ]}
          style={styles.segmentedButtons}
        />
        
        <Searchbar
          placeholder={`Search ${viewMode === 'existing' ? 'matches' : 'potential matches'}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={currentMatches as any[]}
        renderItem={renderItem as any}
        keyExtractor={(item: any) => viewMode === 'existing' ? item.id : item.user.id}
        contentContainerStyle={[
          styles.matchesList,
          currentMatches.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={viewMode === 'existing' ? loadMatches : loadDynamicMatches}
        label={viewMode === 'existing' ? 'Refresh' : 'Find More'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.neutral[600],
  },
  header: {
    padding: spacing.md,
    backgroundColor: 'white',
    gap: spacing.sm,
  },
  segmentedButtons: {
    backgroundColor: colors.neutral[100],
  },
  searchbar: {
    elevation: 2,
  },
  matchesList: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  emptyListContainer: {
    flex: 1,
  },
  matchCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    elevation: 4,
  },
  matchHeader: {
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  compatibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatibilityLabel: {
    fontSize: 14,
    color: colors.neutral[600],
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
    marginBottom: spacing.md,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  skillChip: {
    backgroundColor: colors.primary.light,
  },
  moreSkills: {
    fontSize: 12,
    color: colors.neutral[600],
    alignSelf: 'center',
    marginLeft: spacing.xs,
  },
  matchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.neutral[600],
    marginBottom: spacing.md,
  },
  emptyButton: {
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
  },
});

export default EnhancedMatchesScreen;
