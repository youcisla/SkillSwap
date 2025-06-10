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
    Card,
    FAB,
    Paragraph,
    Searchbar,
    Text
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchChats } from '../store/slices/messageSlice';
import { Chat, RootStackParamList } from '../types';

type MessagesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Messages'>;

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

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const otherParticipant = getOtherParticipant(chat);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item }: { item: Chat }) => {
    const otherParticipant = getOtherParticipant(item);
    const lastMessage = item.lastMessage;
    const unreadCount = 0; // In a real app, you'd calculate this

    return (
      <Card 
        style={styles.chatCard}
        onPress={() => {
          if (otherParticipant) {
            navigation.navigate('Chat', { 
              chatId: item.id, 
              otherUserId: otherParticipant.id 
            });
          }
        }}
      >
        <Card.Content>
          <View style={styles.chatContent}>
            <View style={styles.avatarContainer}>
              <Avatar.Image 
                size={50} 
                source={{ uri: otherParticipant?.profileImage || 'https://via.placeholder.com/50' }}
              />
              {unreadCount > 0 && (
                <Badge style={styles.badge}>{unreadCount}</Badge>
              )}
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>
                  {otherParticipant?.name || 'Unknown User'}
                </Text>
                <Text style={styles.timestamp}>
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
    </View>
  );

  if (loading && chats.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
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
        style={styles.chatsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={styles.fab}
        icon="message-plus"
        onPress={() => navigation.navigate('Matches')}
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
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchbar: {
    elevation: 2,
  },
  chatsList: {
    flex: 1,
  },
  chatCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#6200ea',
  },
  location: {
    fontSize: 12,
    color: '#999',
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
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MessagesScreen;
