import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
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
    Badge,
    Button,
    Card,
    FAB,
    Paragraph,
    Searchbar,
    Text
} from 'react-native-paper';
import SafeAvatar from '../components/SafeAvatar';
import { BulkActionsBar, SelectableItem, SelectionHeader } from '../components/ui/MultiSelection';
import { useMultiSelection } from '../hooks/useMultiSelection';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Multi-selection hook
  const chatSelection = useMultiSelection<Chat>(
    (chat) => chat.id,
    { allowSelectAll: true }
  );

  useEffect(() => {
    if (user?.id) {
      loadChats();
      
      // Connect to socket for real-time updates
      if (!socketService.isSocketConnected()) {
        socketService.connect(user.id);
      }
    }

    // Cleanup socket connection when component unmounts
    return () => {
      // Don't disconnect here as other screens might need it
      // socketService.disconnect();
    };
  }, [user?.id]);

  const loadChats = async () => {
    if (!user?.id) return;
    
    try {
      await dispatch(fetchChats(user.id)).unwrap();
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const getOtherParticipant = (chat: Chat) => {
    const otherUserId = chat.participants.find(id => id !== user?.id);
    return users.find(u => u.id === otherUserId);
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const otherParticipant = getOtherParticipant(chat);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffTime = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleBulkDelete = async () => {
    const selectedChats = filteredChats.filter(chat => chatSelection.isSelected(chat));
    
    if (selectedChats.length === 0) return;

    Alert.alert(
      'Delete Conversations',
      `Are you sure you want to delete ${selectedChats.length} conversation${selectedChats.length === 1 ? '' : 's'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedChats.map(chat => dispatch(deleteChat(chat.id)).unwrap())
              );
              chatSelection.deselectAll();
              setIsSelectionMode(false);
            } catch (error) {
              console.error('Failed to delete conversations:', error);
              Alert.alert('Error', 'Failed to delete some conversations. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleStartSelection = () => {
    setIsSelectionMode(true);
  };

  const handleCancelSelection = () => {
    chatSelection.deselectAll();
    setIsSelectionMode(false);
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const otherParticipant = getOtherParticipant(item);
    // Calculate unread count from lastMessage and user activity if available
    const unreadCount = 0; // Simplified for now - could be enhanced with proper unread tracking

    if (!otherParticipant) return null;

    const handleChatPress = () => {
      const sortedIds = [user?.id, otherParticipant.id].sort();
      const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
      
      navigation.navigate('MessageChat', { 
        chatId, 
        otherUserId: otherParticipant.id 
      });
    };

    const chatContent = (
      <Card style={styles.chatCard}>
        <Card.Content>
          <View style={styles.chatHeader}>
            <View style={styles.chatInfo}>
              <SafeAvatar 
                size={50} 
                source={otherParticipant.profileImage ? { uri: otherParticipant.profileImage } : undefined}
                fallbackText={otherParticipant.name}
                style={styles.chatAvatar}
              />
              <View style={styles.chatDetails}>
                <Text style={styles.participantName}>{otherParticipant.name}</Text>
                <Text style={styles.lastMessageTime}>
                  {item.lastMessage ? formatTimestamp(item.lastMessage.timestamp) : 'No messages'}
                </Text>
                {unreadCount > 0 && (
                  <Badge size={20} style={styles.unreadBadge}>
                    {unreadCount}
                  </Badge>
                )}
              </View>
              
              <Text style={styles.location}>{otherParticipant?.city}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );

    if (isSelectionMode) {
      return (
        <SelectableItem
          isSelected={chatSelection.isSelected(item)}
          onToggleSelection={() => chatSelection.toggleSelection(item)}
          onPress={handleChatPress}
        >
          {chatContent}
        </SelectableItem>
      );
    }

    return (
      <Card style={styles.chatCard} onPress={handleChatPress}>
        <Card.Content>
          <View style={styles.chatHeader}>
            <View style={styles.chatInfo}>
              <SafeAvatar 
                size={50} 
                source={otherParticipant.profileImage ? { uri: otherParticipant.profileImage } : undefined}
                fallbackText={otherParticipant.name}
                style={styles.chatAvatar}
              />
              <View style={styles.chatDetails}>
                <Text style={styles.participantName}>{otherParticipant.name}</Text>
                <Text style={styles.lastMessageTime}>
                  {item.lastMessage ? formatTimestamp(item.lastMessage.timestamp) : 'No messages'}
                </Text>
                {unreadCount > 0 && (
                  <Badge size={20} style={styles.unreadBadge}>
                    {unreadCount}
                  </Badge>
                )}
              </View>
              
              <Text style={styles.location}>{otherParticipant?.city}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Paragraph style={styles.emptyText}>
        Start a conversation with someone from your matches!
      </Paragraph>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('MessagesMain')}
        style={styles.emptyButton}
      >
        Find Matches
      </Button>
    </View>
  );

  if (loading && chats.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.chatsList,
          filteredChats.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
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

      <FAB
        style={styles.fab}
        icon="message-plus"
        onPress={() => {
          // Navigate to tab navigator then to Home tab and UserList
          (navigation as any).navigate('Home', { 
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
  chatsList: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
  },
  chatCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatAvatar: {
    borderRadius: 25,
  },
  chatDetails: {
    marginLeft: 12,
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#666',
  },
  lastMessageContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#6200ea',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  bulkActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 4,
  },
});

export default MessagesScreen;
