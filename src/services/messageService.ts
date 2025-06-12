import { ApiResponse, Chat, Message } from '../types';
import { ApiService } from './apiService';

class MessageService {
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const response = await ApiService.get<ApiResponse<Chat[]>>(`/chats/user/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get user chats');
    } catch (error) {
      console.error('Get user chats error:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string): Promise<{ chatId: string; messages: Message[] }> {
    try {
      const response = await ApiService.get<ApiResponse<Message[]>>(`/chats/${chatId}/messages`);
      
      if (response.success && response.data) {
        return { chatId, messages: response.data };
      }
      
      throw new Error(response.error || 'Failed to get chat messages');
    } catch (error) {
      console.error('Get chat messages error:', error);
      throw error;
    }
  }

  async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'isRead'>): Promise<{ chatId: string; message: Message }> {
    try {
      // Generate consistent chat ID by sorting user IDs
      const sortedIds = [messageData.senderId, messageData.receiverId].sort();
      const chatId = `${sortedIds[0]}-${sortedIds[1]}`;
      
      const response = await ApiService.post<ApiResponse<Message>>('/messages', {
        ...messageData,
        chatId
      });
      
      if (response.success && response.data) {
        return { chatId, message: response.data };
      }
      
      throw new Error(response.error || 'Failed to send message');
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<{ chatId: string; messageIds: string[] }> {
    try {
      const response = await ApiService.put<ApiResponse<string[]>>(
        `/chats/${chatId}/read`,
        { userId }
      );
      
      if (response.success && response.data) {
        return { chatId, messageIds: response.data };
      }
      
      throw new Error(response.error || 'Failed to mark messages as read');
    } catch (error) {
      console.error('Mark messages as read error:', error);
      throw error;
    }
  }

  async createChat(participants: string[]): Promise<Chat> {
    try {
      const response = await ApiService.post<ApiResponse<Chat>>('/chats', { participants });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to create chat');
    } catch (error) {
      console.error('Create chat error:', error);
      throw error;
    }
  }

  async getChatById(chatId: string): Promise<Chat> {
    try {
      const response = await ApiService.get<ApiResponse<Chat>>(`/chats/${chatId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get chat');
    } catch (error) {
      console.error('Get chat error:', error);
      throw error;
    }
  }

  async findOrCreateChat(participants: string[]): Promise<Chat> {
    try {
      const response = await ApiService.post<ApiResponse<Chat>>('/chats/find-or-create', { participants });
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to find or create chat');
    } catch (error) {
      console.error('Find or create chat error:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const response = await ApiService.delete<ApiResponse<void>>(`/messages/${messageId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService();
