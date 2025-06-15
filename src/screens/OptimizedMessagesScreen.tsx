// Enhanced MessagesScreen with real-time features and optimizations
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import {
    Badge,
    Button,
    Card,
    Chip,
    FAB,
    Searchbar,
    Text
} from 'react-native-paper';
import SafeAvatar from '../components/SafeAvatar';
import { EmptyState, LoadingState } from '../components/ui/LoadingState';
import { BulkActionsBar, SelectableItem, SelectionHeader } from '../components/ui/MultiSelection';
// Enhanced components and hooks
import { VirtualizedList } from '../components/optimized/VirtualizedList';
import RealTimeIndicators from '../components/realtime/RealTimeIndicators';
import { useAdvancedAnimation } from '../hooks/useAdvancedAnimation';
import { useMultiSelection } from '../hooks/useMultiSelection';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useOptimizedQuery } from '../hooks/useOptimizedQuery';
import { EnhancedApiService } from '../services/enhancedApiService';
import { socketService } from '../services/socketService';
import { useAppDispatch, useAppSelector } from '../store';
import { deleteChat, fetchChats } from '../store/slices/messageSlice';
import { Chat, MessagesStackParamList, TabParamList } from '../types';

type MessagesScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<MessagesStackParamList, 'MessagesMain'>,
  BottomTabNavigationProp<TabParamList>
>;

interface Props {
  navigation: MessagesScreenNavigationProp;
}

const MessagesScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { chats, loading } = useAppSelector((state) => state.messages);
  const { users } = useAppSelector((state) => state.user);

  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Performance and UX hooks
  const { fadeIn, slideIn } = useAdvancedAnimation();
  const { syncData, isOnline, lastSyncTime } = useOfflineSync('messages');

  // Multi-selection hook for enhanced UX
  const chatSelection = useMultiSelection<Chat>(
    (chat) => chat.id,
    { allowSelectAll: true }
  );

  // Optimized data fetching with caching
  const {
    data: optimizedChats,
    isLoading: isLoadingChats,
    refetch: refetchChats
  } = useOptimizedQuery(
    ['chats', user?.id],
    () => EnhancedApiService.getChats(user?.id || ''),
    {
      enabled: !!user?.id,
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 60 * 1000, // Refetch every minute
    }
  );

  // Enhanced socket setup with real-time features
  useEffect(() => {
    if (user?.id) {
      loadChats();
      
      // Enhanced socket connection with presence and typing indicators
      if (!socketService.isSocketConnected()) {
        socketService.connect(user.id);
      }

      // Setup real-time listeners
      const handleNewMessage = (message: any) => {
        // Refresh chats when new message arrives
        refetchChats();
      };

      const handleTypingStart = (data: { userId: string, userName: string, chatId: string }) => {
        setTypingUsers(prev => ({ ...prev, [data.chatId]: data.userName }));
      };

      const handleTypingStop = (data: { userId: string, chatId: string }) => {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[data.chatId];
          return updated;
        });
      };

      const handleUserOnline = (userId: string) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      };

      const handleUserOffline = (userId: string) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      };

      // Subscribe to socket events
      socketService.onNewMessage(handleNewMessage);
      socketService.onTypingStart(handleTypingStart);
      socketService.onTypingStop(handleTypingStop);
      socketService.onUserOnline(handleUserOnline);
      socketService.onUserOffline(handleUserOffline);

      return () => {
        // Cleanup listeners
        socketService.offNewMessage(handleNewMessage);
        socketService.offTypingStart(handleTypingStart);
        socketService.offTypingStop(handleTypingStop);
        socketService.offUserOnline(handleUserOnline);
        socketService.offUserOffline(handleUserOffline);
      };
    }
  }, [user?.id, refetchChats]);

  const loadChats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await dispatch(fetchChats(user.id)).unwrap();
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  }, [user?.id, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadChats(),
        refetchChats(),
        syncData()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadChats, refetchChats, syncData]);

  const getOtherParticipant = useCallback((chat: Chat) => {
    const otherUserId = chat.participants.find(id => id !== user?.id);
    return users.find(u => u.id === otherUserId);
  }, [user?.id, users]);

  // Enhanced filtering with better search
  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      if (!searchQuery) return true;
      
      const otherParticipant = getOtherParticipant(chat);
      const query = searchQuery.toLowerCase();
      
      // Search by participant name, last message, or chat metadata
      return (
        otherParticipant?.name.toLowerCase().includes(query) ||
        chat.lastMessage?.content?.toLowerCase().includes(query) ||
        chat.metadata?.topic?.toLowerCase().includes(query)
      );
    }).sort((a, b) => {
      // Sort by last message timestamp
      const aTime = a.lastMessage?.timestamp || a.updatedAt;
      const bTime = b.lastMessage?.timestamp || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [chats, searchQuery, getOtherParticipant]);

  const formatTimestamp = useCallback((timestamp: Date) => {
    const now = new Date();
    const msgDate = new Date(timestamp);
    const diffInHours = (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return msgDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }, []);

  // Enhanced bulk actions
  const handleBulkDelete = useCallback(async () => {
    const selectedChatIds = chatSelection.getSelectedItems();
    
    Alert.alert(
      'Delete Conversations',
      `Are you sure you want to delete ${selectedChatIds.length} conversation(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedChatIds.map(chatId => 
                  dispatch(deleteChat(chatId))
                )
              );
              chatSelection.deselectAll();
              setIsSelectionMode(false);
              await refetchChats();
            } catch (error) {
              console.error('Failed to delete chats:', error);
              Alert.alert('Error', 'Failed to delete conversations');
            }
          },
        },
      ]
    );
  }, [chatSelection, dispatch, refetchChats]);

  const handleStartSelection = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const handleCancelSelection = useCallback(() => {
    chatSelection.deselectAll();
    setIsSelectionMode(false);
  }, [chatSelection]);

  // Enhanced chat item renderer with real-time indicators
  const renderChatItem = useCallback(({ item: chat }: { item: Chat }) => {
    const otherParticipant = getOtherParticipant(chat);
    const isSelected = chatSelection.isSelected(chat.id);
    const isTyping = typingUsers[chat.id];
    const isOnline = otherParticipant && onlineUsers.has(otherParticipant.id);
    const unreadCount = chat.unreadCount || 0;

    if (isSelectionMode) {
      return (
        <SelectableItem
          isSelected={isSelected}
          onSelectionChange={(selected) => {
            if (selected) {
              chatSelection.select(chat.id);
            } else {
              chatSelection.deselect(chat.id);
            }
          }}
          style={[styles.chatCard, isSelected && styles.selectedChatCard]}
        >
          <Card.Content>
            <View style={styles.chatHeader}>
              <SafeAvatar
                size={50}
                source={otherParticipant?.profileImage ? { uri: otherParticipant.profileImage } : undefined}
                fallbackText={otherParticipant?.name || 'U'}
                style={styles.chatAvatar}
              />
              <View style={styles.chatInfo}>
                <View style={styles.chatTitleRow}>
                  <Text style={styles.participantName}>
                    {otherParticipant?.name || 'Unknown User'}
                  </Text>
                  {isOnline && (
                    <View style={styles.onlineIndicator} />
                  )}
                  <Text style={styles.lastMessageTime}>
                    {chat.lastMessage && formatTimestamp(new Date(chat.lastMessage.timestamp))}
                  </Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {isTyping ? `${isTyping} is typing...` : chat.lastMessage?.content || 'No messages yet'}
                </Text>
              </View>
              {unreadCount > 0 && (
                <Badge style={styles.unreadBadge}>{unreadCount}</Badge>
              )}
            </View>
          </Card.Content>
        </SelectableItem>
      );
    }

    return (
      <Card 
        style={[
          styles.chatCard, 
          { transform: [{ scale: fadeIn }] },
          unreadCount > 0 && styles.unreadChatCard
        ]}
        onPress={() => {
          navigation.navigate('MessageChat', {
            chatId: chat.id,
            otherUserId: otherParticipant?.id
          });
        }}
      >
        <Card.Content>
          <View style={styles.chatHeader}>
            <View style={styles.avatarContainer}>
              <SafeAvatar
                size={50}
                source={otherParticipant?.profileImage ? { uri: otherParticipant.profileImage } : undefined}
                fallbackText={otherParticipant?.name || 'U'}
                style={styles.chatAvatar}
              />
              {isOnline && (
                <View style={styles.onlineBadge} />
              )}
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatTitleRow}>
                <Text style={[
                  styles.participantName,
                  unreadCount > 0 && styles.unreadParticipantName
                ]}>
                  {otherParticipant?.name || 'Unknown User'}
                </Text>
                <Text style={styles.lastMessageTime}>
                  {chat.lastMessage && formatTimestamp(new Date(chat.lastMessage.timestamp))}
                </Text>
              </View>
              <View style={styles.lastMessageRow}>
                <Text style={[
                  styles.lastMessage,
                  unreadCount > 0 && styles.unreadLastMessage,
                  isTyping && styles.typingMessage
                ]} numberOfLines={1}>
                  {isTyping ? `${isTyping} is typing...` : chat.lastMessage?.content || 'No messages yet'}
                </Text>
                {unreadCount > 0 && (
                  <Badge style={styles.unreadBadge} size={20}>{unreadCount}</Badge>
                )}
              </View>
              {chat.metadata?.topic && (
                <Chip style={styles.topicChip} compact>
                  {chat.metadata.topic}
                </Chip>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }, [getOtherParticipant, chatSelection, isSelectionMode, typingUsers, onlineUsers, fadeIn, formatTimestamp, navigation]);

  const renderEmptyState = () => {
    if (loading || isLoadingChats) {
      return (
        <LoadingState
          variant="skeleton"
          text="Loading conversations..."
          style={styles.loadingState}
        />
      );
    }

    return (
      <EmptyState
        title="No conversations yet"
        description={searchQuery ? `No conversations found for "${searchQuery}"` : "Start a conversation by finding users to connect with"}
        action={
          <Button
            mode="contained"
            onPress={() => {
              navigation.navigate('Home', { 
                screen: 'UserList',
                params: {}
              });
            }}
          >
            Find People to Chat With
          </Button>
        }
        style={styles.emptyState}
      />
    );
  };

  // Offline state
  if (!isOnline) {
    return (
      <View style={[styles.container, styles.offlineContainer]}>
        <RealTimeIndicators
          showOfflineIndicator={true}
          offlineMessage="You're offline. Messages will sync when you reconnect."
        />
        <EmptyState
          title="You're offline"
          description="Connect to the internet to view and send messages"
          style={styles.emptyState}
        />
      </View>
    );
  }

  if (loading && chats.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingState
          variant="spinner"
          text="Loading conversations..."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Real-time indicators */}
      <RealTimeIndicators
        showOnlineStatus={true}
        showSyncStatus={true}
        lastSyncTime={lastSyncTime}
        connectedUsers={onlineUsers.size}
      />

      {/* Enhanced Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search conversations..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Selection Header */}
      {isSelectionMode && (
        <SelectionHeader
          selectedCount={chatSelection.getSelectedCount()}
          totalCount={filteredChats.length}
          onSelectAll={() => chatSelection.selectAll(filteredChats)}
          onDeselectAll={() => chatSelection.deselectAll()}
          onCancel={handleCancelSelection}
          isAllSelected={chatSelection.isAllSelected(filteredChats)}
        />
      )}

      {/* Enhanced Chat List with Virtualization */}
      <VirtualizedList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item: Chat) => item.id}
        estimatedItemSize={80}
        contentContainerStyle={[
          styles.chatsList,
          filteredChats.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        initialNumToRender={10}
        windowSize={10}
      />

      {/* Bulk Actions Bar */}
      {isSelectionMode && (
        <BulkActionsBar
          selectedCount={chatSelection.getSelectedCount()}
          actions={[
            {
              id: 'delete',
              title: 'Delete Selected',
              icon: 'delete',
              onPress: handleBulkDelete,
              destructive: true,
              disabled: chatSelection.getSelectedCount() === 0,
            },
          ]}
        />
      )}

      {/* Selection Toggle FAB */}
      {!isSelectionMode && filteredChats.length > 0 && (
        <FAB
          style={[styles.fab, { bottom: 80 }]}
          icon="select-multiple"
          onPress={handleStartSelection}
          label="Select"
          size="small"
        />
      )}

      {/* New Chat FAB */}
      <FAB
        style={styles.fab}
        icon="message-plus"
        onPress={() => {
          navigation.navigate('Home', { 
            screen: 'UserList',
            params: {}
          });
        }}
        label="New Chat"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  offlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingState: {
    padding: 32,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    ...Platform.select({
      ios: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#f0f0f0',
  },
  chatsList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  chatCard: {
    marginHorizontal: 8,
    marginVertical: 4,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  selectedChatCard: {
    borderWidth: 2,
    borderColor: '#6200ea',
    backgroundColor: '#f3e5f5',
  },
  unreadChatCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6200ea',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    borderRadius: 25,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: 'white',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginLeft: 4,
  },
  chatInfo: {
    marginLeft: 12,
    flex: 1,
  },
  chatTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadParticipantName: {
    fontWeight: '700',
    color: '#000',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadLastMessage: {
    fontWeight: '600',
    color: '#333',
  },
  typingMessage: {
    fontStyle: 'italic',
    color: '#6200ea',
  },
  unreadBadge: {
    backgroundColor: '#6200ea',
    color: 'white',
    marginLeft: 8,
  },
  topicChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#e3f2fd',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ea',
  },
});

export default MessagesScreen;
