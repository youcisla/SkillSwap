import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import {
    Avatar,
    Card,
    Text,
    TextInput
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMessages, markAsRead, sendMessage } from '../../store/slices/messageSlice';
import { fetchUserProfile } from '../../store/slices/userSlice';
import { Message } from '../../types';

// Generic params interface for ChatScreen
interface ChatParams {
  chatId: string;
  otherUserId: string;
}

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { messages, loading } = useAppSelector((state) => state.messages);
  const { users } = useAppSelector((state) => state.user);

  const params = route.params as ChatParams;
  const { chatId, otherUserId } = params;
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const otherUser = users.find(u => u.id === otherUserId);
  const chatMessages = messages[chatId] || [];

  useEffect(() => {
    if (chatId) {
      dispatch(fetchMessages(chatId));
      dispatch(fetchUserProfile(otherUserId));
    }
  }, [chatId, otherUserId]);

  useEffect(() => {
    // Mark messages as read when entering chat
    if (chatId && user?.id) {
      dispatch(markAsRead({ chatId, userId: user.id }));
    }
  }, [chatId, user?.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.id) return;

    try {
      await dispatch(sendMessage({
        senderId: user.id,
        receiverId: otherUserId,
        content: messageText.trim(),
      })).unwrap();
      
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <Card style={[
          styles.messageCard,
          isOwnMessage ? styles.ownMessageCard : styles.otherMessageCard
        ]}>
          <Card.Content style={styles.messageContent}>
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
            <Text style={[
              styles.timestamp,
              isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              {new Date(item.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Avatar.Image 
        size={40} 
        source={{ uri: otherUser?.profileImage || 'https://via.placeholder.com/40' }}
      />
      <View style={styles.headerText}>
        <Text style={styles.headerName}>{otherUser?.name || 'Unknown User'}</Text>
        <Text style={styles.headerSubtitle}>{otherUser?.city}</Text>
      </View>
    </View>
  );

  if (loading && chatMessages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderHeader()}
      
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          label="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          style={styles.messageInput}
          mode="outlined"
          multiline
          maxLength={500}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            />
          }
          onSubmitEditing={handleSendMessage}
        />
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageCard: {
    elevation: 2,
  },
  ownMessageCard: {
    backgroundColor: '#6200ea',
  },
  otherMessageCard: {
    backgroundColor: 'white',
  },
  messageContent: {
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: '#666',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  messageInput: {
    maxHeight: 100,
  },
});

export default ChatScreen;
