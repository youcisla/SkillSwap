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
import { fetchMessages, findOrCreateChat, markAsRead, sendMessage } from '../../store/slices/messageSlice';
import { fetchUserProfile } from '../../store/slices/userSlice';
import { Message } from '../../types';

// Debug utility - remove in production
const debugLog = (message: string, data?: any) => {
  if (__DEV__) {
    console.log(`🐛 ChatScreen: ${message}`, data || '');
  }
};

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
  const [actualChatId, setActualChatId] = useState<string>(chatId);
  const flatListRef = useRef<FlatList>(null);

  const otherUser = users.find(u => u.id === otherUserId);
  const chatMessages = messages[actualChatId] || [];

  // Debug logging
  useEffect(() => {
    debugLog('Component mounted/updated', {
      chatId,
      actualChatId,
      otherUserId,
      userId: user?.id,
      messagesCount: chatMessages.length,
      otherUserFound: !!otherUser
    });
  }, [chatId, actualChatId, otherUserId, user?.id, chatMessages.length, otherUser]);

  useEffect(() => {
    const initializeChat = async () => {
      if (user?.id && otherUserId) {
        try {
          debugLog('Initializing chat', { userId: user.id, otherUserId });
          
          // First, ensure the chat exists by finding or creating it
          const chatResult = await dispatch(findOrCreateChat([user.id, otherUserId])).unwrap();
          debugLog('Chat found/created', chatResult);
          
          // Use the actual chat ID returned from the backend
          const resultChatId = chatResult.id || chatId;
          setActualChatId(resultChatId);
          debugLog('Using chat ID', resultChatId);
          
          // Then fetch messages for the chat
          debugLog('Fetching messages for chat', resultChatId);
          await dispatch(fetchMessages(resultChatId));
          
          // Fetch the other user's profile
          dispatch(fetchUserProfile(otherUserId));
        } catch (error) {
          console.error('Failed to initialize chat:', error);
          debugLog('Chat initialization error', error);
        }
      }
    };

    initializeChat();
  }, [chatId, otherUserId, user?.id]);

  useEffect(() => {
    // Mark messages as read when entering chat (only if we have messages)
    if (actualChatId && user?.id && chatMessages.length > 0) {
      dispatch(markAsRead({ chatId: actualChatId, userId: user.id }));
    }
  }, [actualChatId, user?.id, chatMessages.length]);

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
      debugLog('Sending message', { 
        actualChatId, 
        content: messageText.trim(),
        sender: user.id,
        receiver: otherUserId 
      });
      
      await dispatch(sendMessage({
        senderId: user.id,
        receiverId: otherUserId,
        content: messageText.trim(),
        chatId: actualChatId,
      })).unwrap();
      
      setMessageText('');
      debugLog('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      debugLog('Send message error', error);
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
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
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
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Image 
          size={40}
          source={{ uri: otherUser?.profileImage || `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#6200ea"/><text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-size="18" font-family="Arial">${(otherUser?.name || 'U').charAt(0).toUpperCase()}</text></svg>`)}` }}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.name || 'Unknown User'}</Text>
          <Text style={styles.headerSubtitle}>{otherUser?.city}</Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        inverted={false}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
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
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  headerInfo: {
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
  messagesContent: {
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
  },
  ownMessageCard: {
    backgroundColor: '#6200ea',
  },
  otherMessageCard: {
    backgroundColor: 'white',
  },
  messageContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    maxHeight: 100,
  },
});

export default ChatScreen;
