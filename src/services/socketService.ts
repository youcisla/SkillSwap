import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage } from '../store/slices/messageSlice';
import { authService } from './authService';
import { notificationService } from './notificationService';

class SocketService {
  private socket: Socket | null = null;
  private baseUrl = __DEV__ ? 'http://192.168.1.93:3000' : 'https://your-production-url.com';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;
  private currentUserId: string | null = null;
  private currentToken: string | null = null;
  private isAuthenticating = false;

  async connect(userId: string, token?: string) {
    if (this.socket?.connected && this.currentUserId === userId) {
      return;
    }

    // Get stored token if not provided
    if (!token) {
      token = await authService.getStoredToken();
    }
    
    // Store for reconnection
    this.currentUserId = userId;
    this.currentToken = token || null;
    
    // Disconnect existing socket if it exists
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.socket = io(this.baseUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      auth: {
        token: token || null
      }
    });

    this.setupEventListeners(userId, token);
  }

  private setupEventListeners(userId: string, token?: string) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Authenticate with token if provided
      if (token && !this.isAuthenticating) {
        this.isAuthenticating = true;
        this.socket?.emit('authenticate', token);
      }
      
      // Join user's personal room for notifications
      this.socket?.emit('join-user-room', userId);
    });

    this.socket.on('authenticated', (data) => {
      this.isAuthenticating = false;
    });

    this.socket.on('authentication-failed', () => {
      this.isAuthenticating = false;
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      this.isAuthenticating = false;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.isAuthenticating = false;
      
      // Auto-reconnect if not a manual disconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.attemptReconnect(userId);
      }
    });

    // Real-time message events
    this.socket.on('new-message', (messageData) => {
      // Transform the message data to match our Message interface
      const transformedMessage = {
        id: messageData.id || messageData._id,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        timestamp: messageData.timestamp || messageData.createdAt || new Date().toISOString(),
        isRead: messageData.isRead || false,
        chatId: messageData.chatId
      };

      // Add message to store
      store.dispatch(addMessage({
        chatId: messageData.chatId,
        message: transformedMessage
      }));

      // Show notification if message is not from current user
      if (messageData.senderId !== userId) {
        notificationService.scheduleLocalNotification(
          'New Message',
          messageData.content && messageData.content.length > 50 
            ? `${messageData.content.substring(0, 50)}...` 
            : messageData.content || 'New message received',
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
      
      setTimeout(() => {
        if (this.currentUserId && this.currentToken) {
          this.connect(this.currentUserId, this.currentToken);
        } else if (this.currentUserId) {
          this.connect(this.currentUserId);
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  joinChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
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
      // Use the correct event name that matches the backend
      this.socket.emit('send-message', {
        chatId: messageData.chatId,
        content: messageData.content,
        type: 'text'
      });
    } else {
      console.warn('⚠️ Socket not connected, cannot send real-time message');
    }
  }

  disconnect() {
    if (this.socket) {
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

  // Event listener methods for components
  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  offNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.off('new-message', callback);
    }
  }

  onNewMatch(callback: (match: any) => void) {
    if (this.socket) {
      this.socket.on('new-match', callback);
    }
  }

  offNewMatch(callback: (match: any) => void) {
    if (this.socket) {
      this.socket.off('new-match', callback);
    }
  }

  onConnectionError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.on('connect_error', callback);
    }
  }

  offConnectionError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.off('connect_error', callback);
    }
  }

  onDisconnect(callback: (reason: string) => void) {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }

  offDisconnect(callback: (reason: string) => void) {
    if (this.socket) {
      this.socket.off('disconnect', callback);
    }
  }

  onConnect(callback: () => void) {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  offConnect(callback: () => void) {
    if (this.socket) {
      this.socket.off('connect', callback);
    }
  }

  onTypingStart(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user-typing-start', callback);
    }
  }

  offTypingStart(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('user-typing-start', callback);
    }
  }

  onTypingStop(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user-typing-stop', callback);
    }
  }

  offTypingStop(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('user-typing-stop', callback);
    }
  }

  onUserOnline(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user-online', callback);
    }
  }

  offUserOnline(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('user-online', callback);
    }
  }

  onUserOffline(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user-offline', callback);
    }
  }

  offUserOffline(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('user-offline', callback);
    }
  }

  // Emit typing indicators
  startTyping(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing-start', { chatId });
    }
  }

  stopTyping(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing-stop', { chatId });
    }
  }
}

export const socketService = new SocketService();
