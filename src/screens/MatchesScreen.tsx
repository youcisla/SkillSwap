import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  FAB,
  Paragraph,
  Searchbar,
  Text,
  Title
} from 'react-native-paper';
import SafeAvatar from '../components/SafeAvatar';
import { BulkActionsBar, SelectableItem, SelectionHeader } from '../components/ui/MultiSelection';
import { useMultiSelection } from '../hooks/useMultiSelection';
import { socketService } from '../services/socketService';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMatches, removeMatch } from '../store/slices/matchSlice';
import { addUserToCache } from '../store/slices/userSlice';
import { Match, MatchesStackParamList } from '../types';
import { MatchDataNormalizer } from '../utils/matchDataNormalizer';

type MatchesScreenNavigationProp = StackNavigationProp<MatchesStackParamList, 'MatchesMain'>;

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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Multi-selection hook
  const matchSelection = useMultiSelection<Match>(
    (match) => {
      const matchWithId = match as any;
      return matchWithId.id || matchWithId._id || `temp-${Date.now()}`;
    },
    { allowSelectAll: true }
  );

  useEffect(() => {
    if (user?.id) {
      loadMatches();
      
      // Enhanced WebSocket connection and error handling
      const initializeSocket = () => {
        try {
          if (!socketService.isSocketConnected()) {
            socketService.connect(user.id);
          }
          
          // Setup match-specific event listeners
          const handleNewMatch = (matchData: any) => {
            // Refresh matches when a new match is received
            loadMatches();
          };

          const handleSocketReconnect = () => {
            setSocketError(null);
            setSocketConnected(true);
          };

          const handleSocketDisconnect = (reason: string) => {
            setSocketConnected(false);
            if (__DEV__ && reason === 'io server disconnect') {
              setSocketError('Lost connection to server. Trying to reconnect...');
            }
          };

          const handleSocketConnectError = (error: any) => {
            setSocketConnected(false);
            if (__DEV__) {
              setSocketError('WebSocket connection failed. Some features may not work properly.');
            }
          };

          // Check initial connection status
          setSocketConnected(socketService.isSocketConnected());

          // Subscribe to socket events
          socketService.onNewMatch(handleNewMatch);
          socketService.onConnectionError(handleSocketConnectError);
          socketService.onDisconnect(handleSocketDisconnect);
          socketService.onConnect(handleSocketReconnect);

          return () => {
            // Cleanup listeners
            socketService.offNewMatch(handleNewMatch);
            socketService.offConnectionError(handleSocketConnectError);
            socketService.offDisconnect(handleSocketDisconnect);
            socketService.offConnect(handleSocketReconnect);
          };
        } catch (error) {
          if (__DEV__) {
            setSocketError('Failed to initialize real-time features.');
          }
        }
      };

      const cleanup = initializeSocket();
      
      return cleanup;
    }
  }, [user?.id]);

  // Enhanced and simplified data extraction using MatchDataNormalizer
  const getMatchedUser = useCallback((match: Match) => {
    const normalizedMatch = MatchDataNormalizer.normalizeMatch(match);
    if (!normalizedMatch) return null;
    
    return MatchDataNormalizer.getOtherUser(normalizedMatch, user?.id || '');
  }, [user?.id]);

  // Enhanced skills extraction using MatchDataNormalizer
  const getMatchedSkills = useCallback((match: Match) => {
    const normalizedMatch = MatchDataNormalizer.normalizeMatch(match);
    if (!normalizedMatch) return [];
    
    const skills = MatchDataNormalizer.getOtherUserSkills(normalizedMatch, user?.id || '');
    return MatchDataNormalizer.extractSkillNames(skills);
  }, [user?.id]);

  const filteredMatches = matches.filter(match => {
    if (!searchQuery) return true;
    
    const matchedUser = getMatchedUser(match);
    const matchedSkills = getMatchedSkills(match);
    
    const nameMatch = matchedUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const skillsMatch = matchedSkills.some(skill => 
      String(skill).toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return nameMatch || skillsMatch;
  });

  const loadMatches = async () => {
    if (!user?.id) return;
    
    try {
      const fetchedMatches = await dispatch(fetchMatches(user.id)).unwrap();
      
      // Cache all matched users in the user store for easy access
      fetchedMatches.forEach(match => {
        const matchData = match as any;
        
        // Add populated user data to cache if available
        if (matchData.user1Id && typeof matchData.user1Id === 'object') {
          dispatch(addUserToCache(matchData.user1Id));
        }
        if (matchData.user2Id && typeof matchData.user2Id === 'object') {
          dispatch(addUserToCache(matchData.user2Id));
        }
      });
    } catch (error) {
      // Check if it's a network/socket related error
      if (error instanceof Error) {
        if (error.message.includes('socket') || error.message.includes('websocket') || error.message.includes('connection')) {
          if (__DEV__) {
            setSocketError('Failed to load matches due to connection issues. Please try again.');
          }
        } else {
          Alert.alert(
            'Error Loading Matches',
            'There was a problem loading your matches. Please check your internet connection and try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry', onPress: loadMatches }
            ]
          );
        }
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Clear any previous socket errors on refresh
      setSocketError(null);
      
      // Ensure socket connection is active
      if (user?.id && !socketService.isSocketConnected()) {
        socketService.connect(user.id);
      }
      
      await loadMatches();
    } catch (error) {
      // Handle refresh errors silently or show minimal feedback
    } finally {
      setRefreshing(false);
    }
  };

  const handleBulkUnmatch = async () => {
    const selectedMatches = filteredMatches.filter(match => matchSelection.isSelected(match));
    
    if (selectedMatches.length === 0) return;

    Alert.alert(
      'Remove Matches',
      `Are you sure you want to remove ${selectedMatches.length} match${selectedMatches.length === 1 ? '' : 'es'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedMatches.map(match => dispatch(removeMatch(match.id)).unwrap())
              );
              matchSelection.deselectAll();
              setIsSelectionMode(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove some matches. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBulkMessage = async () => {
    const selectedMatches = filteredMatches.filter(match => matchSelection.isSelected(match));
    
    if (selectedMatches.length === 0) return;

    Alert.alert(
      'Message Multiple Users',
      `Send a message to ${selectedMatches.length} user${selectedMatches.length === 1 ? '' : 's'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Message All',
          onPress: () => {
            selectedMatches.forEach(match => {
              const matchedUser = getMatchedUser(match);
              if (matchedUser) {
                const userId = String(matchedUser.id || matchedUser._id);
                const sortedIds = [String(user?.id), userId].sort();
                const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
                
                // Navigate to Messages tab and then to specific chat
                (navigation as any).navigate('Messages', {
                  screen: 'MessageChat',
                  params: { chatId, otherUserId: userId }
                });
              }
            });
            matchSelection.deselectAll();
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleStartSelection = () => {
    setIsSelectionMode(true);
  };

  const handleCancelSelection = () => {
    matchSelection.deselectAll();
    setIsSelectionMode(false);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No matches found</Text>
      <Paragraph style={styles.emptyText}>
        {searchQuery 
          ? "Try adjusting your search criteria" 
          : "We'll find matches for you based on your skills and preferences!"
        }
      </Paragraph>
      <Button 
        mode="contained" 
        onPress={() => {
          setSearchQuery('');
          loadMatches();
        }}
        style={styles.emptyButton}
      >
        {searchQuery ? "Clear Search" : "Refresh Matches"}
      </Button>
    </View>
  );

  const handleMatchPress = (item: Match) => {
    const matchedUser = getMatchedUser(item);
    if (!matchedUser) {
      return;
    }
    
    const userId = String(matchedUser.id || matchedUser._id);
    
    navigation.navigate('MatchUserProfile', { userId });
  };

  const renderMatchCard = useCallback(({ item }: { item: Match }) => {
    const matchedUser = getMatchedUser(item);
    const matchedSkills = getMatchedSkills(item);

    if (!matchedUser) {
      // Return placeholder card for missing user data
      return (
        <Card style={[styles.matchCard, { backgroundColor: '#f5f5f5', opacity: 0.6 }]}>
          <Card.Content>
            <Text style={{ textAlign: 'center', color: '#666' }}>
              Match data loading...
            </Text>
          </Card.Content>
        </Card>
      );
    }

    // matchedSkills is already filtered and safe from our simplified function
    const safeMatchedSkills = matchedSkills;

    const matchContent = (
      <Card style={styles.matchCard}>
        <Card.Content>
          <View style={styles.matchHeader}>
            <View style={styles.userInfo}>
              <SafeAvatar 
                size={60} 
                source={matchedUser.profileImage ? { uri: matchedUser.profileImage } : undefined}
                fallbackText={matchedUser.name || 'U'}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Title style={styles.userName}>{matchedUser.name || 'Unknown User'}</Title>
                <Text style={styles.userLocation}>{matchedUser.city || 'Unknown Location'}</Text>
                <View style={styles.compatibilityContainer}>
                  <Text style={styles.compatibilityLabel}>Match: </Text>
                  <Chip 
                    style={[styles.compatibilityChip, { backgroundColor: getCompatibilityColor(item.compatibilityScore || 0) }]}
                    textStyle={styles.compatibilityText}
                  >
                    {`${item.compatibilityScore || 0}%`}
                  </Chip>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>Shared Skills</Text>
            <View style={styles.skillsContainer}>
              {safeMatchedSkills
                .slice(0, 3)
                .filter(skill => String(skill || '').trim().length > 0)
                .map((skill, index) => {
                  const matchId = (item as any).id || (item as any)._id || `${(item as any).user1Id}-${(item as any).user2Id}`;
                  const skillName = String(skill || '').trim();
                  
                  return (
                    <Chip key={`skill-${matchId}-${skillName}-${index}`} style={styles.skillChip}>
                      {skillName}
                    </Chip>
                  );
                })}
              {safeMatchedSkills.length > 3 && (
                <Chip key={`more-skills-${(item as any).id || (item as any)._id || 'fallback'}`} style={styles.moreSkillsChip}>
                  {`+${Math.max(0, safeMatchedSkills.length - 3)} more`}
                </Chip>
              )}
            </View>
          </View>

          {!isSelectionMode && (
            <View style={styles.matchActions}>
              <Button 
                mode="outlined" 
                onPress={() => handleMatchPress(item)}
                style={styles.actionButton}
              >
                View Profile
              </Button>
              <Button 
                mode="contained" 
                onPress={() => {
                  const userId = String(matchedUser.id || matchedUser._id);
                  const sortedIds = [String(user?.id), userId].sort();
                  const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
                  
                  // Navigate to Messages tab and then to specific chat
                  (navigation as any).navigate('Messages', {
                    screen: 'MessageChat',
                    params: { chatId, otherUserId: userId }
                  });
                }}
                style={styles.actionButton}
              >
                Message
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );

    if (isSelectionMode) {
      return (
        <SelectableItem
          isSelected={matchSelection.isSelected(item)}
          onToggleSelection={() => matchSelection.toggleSelection(item)}
          onPress={() => handleMatchPress(item)}
        >
          {matchContent}
        </SelectableItem>
      );
    }

    return matchContent;
  }, [isSelectionMode, matchSelection, user?.id, navigation]);

  const keyExtractor = useCallback((item: Match) => {
    // Handle both id and _id for compatibility with backend
    const itemWithId = item as any;
    const matchId = itemWithId.id || itemWithId._id;
    if (matchId) {
      return String(matchId);
    }
    // Fallback: create a stable key from user IDs
    const user1 = typeof itemWithId.user1Id === 'object' ? itemWithId.user1Id?.id || itemWithId.user1Id?._id : itemWithId.user1Id;
    const user2 = typeof itemWithId.user2Id === 'object' ? itemWithId.user2Id?.id || itemWithId.user2Id?._id : itemWithId.user2Id;
    return `match-${user1}-${user2}`;
  }, []);

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
        
        {/* WebSocket Connection Status - Development Only */}
        {__DEV__ && socketError && (
          <Card style={[styles.errorCard, { marginTop: 8 }]}>
            <Card.Content style={styles.errorContent}>
              <Text style={styles.errorText}>⚠️ {socketError}</Text>
              <Button 
                mode="text" 
                onPress={() => {
                  setSocketError(null);
                  if (user?.id && !socketService.isSocketConnected()) {
                    socketService.connect(user.id);
                  }
                }}
                compact
              >
                Retry
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Selection Header */}
      {isSelectionMode && (
        <SelectionHeader
          selectedCount={matchSelection.getSelectedCount()}
          totalCount={filteredMatches.length}
          onSelectAll={() => matchSelection.selectAll(filteredMatches)}
          onDeselectAll={() => matchSelection.deselectAll()}
          onCancel={handleCancelSelection}
          isAllSelected={matchSelection.isAllSelected(filteredMatches)}
        />
      )}

      <FlatList
        data={filteredMatches}
        renderItem={renderMatchCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.matchesList,
          filteredMatches.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={4}
        updateCellsBatchingPeriod={50}
      />

      {/* Bulk Actions Bar */}
      {isSelectionMode && (
        <BulkActionsBar
          selectedCount={matchSelection.getSelectedCount()}
          actions={[
            {
              id: 'message',
              title: 'Message Selected',
              icon: 'message',
              onPress: handleBulkMessage,
              disabled: matchSelection.getSelectedCount() === 0,
            },
            {
              id: 'unmatch',
              title: 'Remove Selected',
              icon: 'close',
              onPress: handleBulkUnmatch,
              destructive: true,
              disabled: matchSelection.getSelectedCount() === 0,
            },
          ]}
        />
      )}

      {/* Selection Toggle FAB */}
      {!isSelectionMode && filteredMatches.length > 0 && (
        <FAB
          style={[styles.fab, { bottom: 80 }]}
          icon="select-multiple"
          onPress={handleStartSelection}
          label="Select"
          size="small"
        />
      )}

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
  avatar: {
    borderRadius: 30,
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
  moreSkillsChip: {
    margin: 2,
    backgroundColor: '#f5f5f5',
  },
  moreSkills: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'center',
    marginLeft: 8,
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
  errorCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MatchesScreen;
