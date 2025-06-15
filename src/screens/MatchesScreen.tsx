import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
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
import ProfileDebugger from '../utils/profileDebugger';

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
    (match) => match.id,
    { allowSelectAll: true }
  );

  useEffect(() => {
    if (user?.id) {
      loadMatches();
      
      // Enhanced WebSocket connection and error handling
      const initializeSocket = () => {
        try {
          if (!socketService.isSocketConnected()) {
            console.log('🔌 Initializing socket connection for matches...');
            socketService.connect(user.id);
          }
          
          // Setup match-specific event listeners
          const handleNewMatch = (matchData: any) => {
            console.log('💖 New match received in MatchesScreen:', matchData);
            // Refresh matches when a new match is received
            loadMatches();
          };

          const handleSocketReconnect = () => {
            console.log('✅ Socket reconnected in MatchesScreen');
            setSocketError(null);
            setSocketConnected(true);
          };

          const handleSocketDisconnect = (reason: string) => {
            console.log('🔌 Socket disconnected in MatchesScreen:', reason);
            setSocketConnected(false);
            if (reason === 'io server disconnect') {
              setSocketError('Lost connection to server. Trying to reconnect...');
            }
          };

          const handleSocketConnectError = (error: any) => {
            console.error('❌ Socket connection error in MatchesScreen:', error);
            setSocketConnected(false);
            setSocketError('WebSocket connection failed. Some features may not work properly.');
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
          console.error('❌ Failed to initialize socket for matches:', error);
          setSocketError('Failed to initialize real-time features.');
        }
      };

      const cleanup = initializeSocket();
      
      return cleanup;
    }
  }, [user?.id]);

  const getMatchedUser = (match: Match) => {
    const matchData = match as any;
    
    // Handle populated match data where user1Id and user2Id are objects
    const user1Data = matchData.user1Id;
    const user2Data = matchData.user2Id;
    
    // Extract actual IDs for comparison (handle both string IDs and populated objects)
    const user1Id = typeof user1Data === 'object' ? user1Data.id || user1Data._id : user1Data;
    const user2Id = typeof user2Data === 'object' ? user2Data.id || user2Data._id : user2Data;
    
    console.log('MatchesScreen: getMatchedUser called', {
      matchId: match.id,
      currentUserId: user?.id,
      user1Id,
      user2Id,
      user1DataType: typeof user1Data,
      user2DataType: typeof user2Data
    });
    
    // Determine which user is the "other" user
    if (String(user1Id) === String(user?.id)) {
      // Current user is user1, so return user2
      if (typeof user2Data === 'object') {
        console.log('MatchesScreen: Found populated user2:', user2Data.name);
        return user2Data;
      }
    } else if (String(user2Id) === String(user?.id)) {
      // Current user is user2, so return user1
      if (typeof user1Data === 'object') {
        console.log('MatchesScreen: Found populated user1:', user1Data.name);
        return user1Data;
      }
    }
    
    // Fallback to finding in users array using the actual user ID
    const otherUserId = String(user1Id) === String(user?.id) ? user2Id : user1Id;
    const foundUser = users.find(u => String(u.id) === String(otherUserId));
    console.log('MatchesScreen: Fallback search result:', foundUser ? foundUser.name : 'NOT FOUND');
    
    return foundUser;
  };

  const getMatchedSkills = (match: Match) => {
    const matchData = match as any;
    
    // Extract actual IDs for comparison (handle both string IDs and populated objects)
    const user1Id = typeof matchData.user1Id === 'object' ? matchData.user1Id.id || matchData.user1Id._id : matchData.user1Id;
    
    return String(user1Id) === String(user?.id) ? match.user1Skills : match.user2Skills;
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

  const loadMatches = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔍 Loading matches for user:', user.id);
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

      console.log('✅ Successfully loaded', fetchedMatches.length, 'matches');
    } catch (error) {
      console.error('❌ Failed to load matches:', error);
      
      // Check if it's a network/socket related error
      if (error instanceof Error) {
        if (error.message.includes('socket') || error.message.includes('websocket') || error.message.includes('connection')) {
          setSocketError('Failed to load matches due to connection issues. Please try again.');
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
        console.log('🔄 Re-establishing socket connection during refresh...');
        socketService.connect(user.id);
      }
      
      await loadMatches();
    } catch (error) {
      console.error('❌ Refresh failed:', error);
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
              console.error('Failed to remove matches:', error);
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
      console.warn('MatchesScreen: No matched user found for match:', item.id);
      return;
    }

    console.log('MatchesScreen: Match pressed:', {
      matchId: item.id,
      matchedUserId: matchedUser.id || matchedUser._id,
      matchedUserName: matchedUser.name,
      currentUserId: user?.id
    });
    
    const userId = String(matchedUser.id || matchedUser._id);
    ProfileDebugger.logMatchClick(item.id, userId, matchedUser);
    ProfileDebugger.logUserStore(users, user);
    
    navigation.navigate('MatchUserProfile', { userId });
  };

  const renderMatchCard = ({ item }: { item: Match }) => {
    const matchedUser = getMatchedUser(item);
    const matchedSkills = getMatchedSkills(item);

    if (!matchedUser) {
      console.warn('MatchesScreen: No matched user found for match:', item.id);
      return null;
    }

    const matchContent = (
      <Card style={styles.matchCard}>
        <Card.Content>
          <View style={styles.matchHeader}>
            <View style={styles.userInfo}>
              <SafeAvatar 
                size={60} 
                source={matchedUser.profileImage ? { uri: matchedUser.profileImage } : undefined}
                fallbackText={matchedUser.name}
                style={styles.avatar}
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
                <Chip key={`${skill}-${index}`} style={styles.skillChip}>
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
  };

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
        
        {/* WebSocket Connection Status */}
        {socketError && (
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.matchesList,
          filteredMatches.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
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
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    flex: 1,
  },
});

export default MatchesScreen;
