import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
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
    Badge,
    Button,
    Card,
    FAB,
    Paragraph,
    Searchbar,
    Text
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchChats } from '../store/slices/messageSlice';
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

  useEffect(() => {
    if (user?.id) {
      loadChats();
    }
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

  const renderChatItem = ({ item }: { item: Chat }) => {
    const otherParticipant = getOtherParticipant(item);
    const lastMessage = item.lastMessage;
    // Note: unreadCount would need to be added to Chat type or calculated separately
    const unreadCount = 0; // Temporary fix - implement proper unread count logic

    if (!otherParticipant) return null;

    return (
      <Card 
        style={styles.chatCard}
        onPress={() => navigation.navigate('MessageChat', {
          chatId: item.id,
          otherUserId: otherParticipant.id
        })}
      >
        <Card.Content>
          <View style={styles.chatHeader}>
            <View style={styles.chatInfo}>
              <Avatar.Image 
                size={50}
                source={{ uri: otherParticipant.profileImage || `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="#6200ea"/><text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-size="22" font-family="Arial">${(otherParticipant.name || 'U').charAt(0).toUpperCase()}</text></svg>`)}` }}
              />
              <View style={styles.chatDetails}>
                <Text style={styles.participantName}>
                  {otherParticipant.name}
                </Text>
                <Text style={styles.lastMessageTime}>
                  {lastMessage && formatTimestamp(lastMessage.timestamp)}
                </Text>
              </View>
              
              <View style={styles.lastMessageContainer}>
                <Text 
                  style={styles.lastMessage}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {lastMessage?.content || 'No messages yet'}
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
});

export default MessagesScreen;
