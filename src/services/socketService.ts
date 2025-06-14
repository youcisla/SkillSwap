import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage } from '../store/slices/messageSlice';
import { notificationService } from './notificationService';

class SocketService {
  private socket: Socket | null = null;
  private baseUrl = __DEV__ ? 'http://localhost:3000' : 'https://your-production-url.com';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('🔌 Connecting to socket server...');
    
    this.socket = io(this.baseUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: false,
    });

    this.setupEventListeners(userId);
  }

  private setupEventListeners(userId: string) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user's personal room for notifications
      this.socket?.emit('join-user-room', userId);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      
      // Auto-reconnect if not a manual disconnect
      if (reason === 'io server disconnect') {
        this.attemptReconnect(userId);
      }
    });

    // Real-time message events
    this.socket.on('new-message', (messageData) => {
      console.log('📨 New message received:', messageData);
      
      // Add message to store
      store.dispatch(addMessage({
        chatId: messageData.chatId,
        message: {
          id: messageData.id || messageData._id,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          content: messageData.content,
          timestamp: messageData.timestamp || messageData.createdAt,
          isRead: false,
        }
      }));

      // Show notification if message is not from current user
      if (messageData.senderId !== userId) {
        notificationService.scheduleLocalNotification(
          'New Message',
          messageData.content.length > 50 
            ? `${messageData.content.substring(0, 50)}...` 
            : messageData.content,
          {
            type: 'message',
            chatId: messageData.chatId,
            senderId: messageData.senderId,
          }
        );
      }
    });

    // Real-time match events
    this.socket.on('new-match', (matchData) => {
      console.log('💖 New match received:', matchData);
      
      // Show notification
      notificationService.scheduleLocalNotification(
        'New Match!',
        `You matched with ${matchData.userName || 'someone'}!`,
        {
          type: 'match',
          matchId: matchData.matchId,
          userId: matchData.userId,
        }
      );
    });

    // Real-time follow events
    this.socket.on('new-follower', (followerData) => {
      console.log('👤 New follower:', followerData);
      
      // Show notification
      notificationService.scheduleLocalNotification(
        'New Follower',
        `${followerData.userName || 'Someone'} started following you!`,
        {
          type: 'follower',
          userId: followerData.userId,
        }
      );
    });

    // Real-time session events
    this.socket.on('session-update', (sessionData) => {
      console.log('📅 Session update:', sessionData);
      
      // Show notification for session status changes
      notificationService.scheduleLocalNotification(
        'Session Update',
        `Your session has been ${sessionData.status}`,
        {
          type: 'session',
          sessionId: sessionData.sessionId,
        }
      );
    });
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(userId);
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  joinChat(chatId: string) {
    if (this.socket?.connected) {
      console.log('🏠 Joining chat:', chatId);
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      console.log('🚪 Leaving chat:', chatId);
      this.socket.emit('leave-chat', chatId);
    }
  }

  sendMessage(messageData: {
    chatId: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
  }) {
    if (this.socket?.connected) {
      console.log('📤 Emitting message:', messageData);
      this.socket.emit('send-message', messageData);
    } else {
      console.warn('⚠️ Socket not connected, cannot send real-time message');
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Emit user status changes
  updateUserStatus(status: 'online' | 'offline' | 'away') {
    if (this.socket?.connected) {
      this.socket.emit('user-status', { status });
    }
  }

  // Join user room for personal notifications
  joinUserRoom(userId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-user-room', userId);
    }
  }
}

export const socketService = new SocketService();
