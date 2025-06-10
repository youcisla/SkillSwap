import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { messageService } from '../../services/messageService';
import { Chat, Message, MessageState } from '../../types';

const initialState: MessageState = {
  chats: [],
  messages: {},
  loading: false,
  error: null,
};

// Async thunks
export const fetchChats = createAsyncThunk(
  'messages/fetchChats',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await messageService.getUserChats(userId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (chatId: string, { rejectWithValue }) => {
    try {
      return await messageService.getChatMessages(chatId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: Omit<Message, 'id' | 'timestamp' | 'isRead'>, { rejectWithValue }) => {
    try {
      return await messageService.sendMessage(messageData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async ({ chatId, userId }: { chatId: string; userId: string }, { rejectWithValue }) => {
    try {
      return await messageService.markMessagesAsRead(chatId, userId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createChat = createAsyncThunk(
  'messages/createChat',
  async (participants: string[], { rejectWithValue }) => {
    try {
      return await messageService.createChat(participants);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.chats = [];
      state.messages = {};
      state.error = null;
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
      
      // Update chat's last message
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].updatedAt = message.timestamp;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chats
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action: PayloadAction<Chat[]>) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
        state.loading = false;
        const { chatId, messages } = action.payload;
        state.messages[chatId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send message
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
        const { chatId, message } = action.payload;
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        state.messages[chatId].push(message);
        
        // Update chat's last message
        const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].lastMessage = message;
          state.chats[chatIndex].updatedAt = message.timestamp;
        }
      })
      // Create chat
      .addCase(createChat.fulfilled, (state, action: PayloadAction<Chat>) => {
        state.chats.push(action.payload);
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<{ chatId: string; messageIds: string[] }>) => {
        const { chatId, messageIds } = action.payload;
        if (state.messages[chatId]) {
          state.messages[chatId] = state.messages[chatId].map(message =>
            messageIds.includes(message.id) ? { ...message, isRead: true } : message
          );
        }
      });
  },
});

export const { clearMessages, addMessage, clearError } = messageSlice.actions;
export default messageSlice.reducer;
