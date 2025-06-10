import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { sessionService } from '../../services/sessionService';
import { Session, SessionState, SessionStatus } from '../../types';

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await sessionService.getUserSessions(userId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSession = createAsyncThunk(
  'sessions/createSession',
  async (sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      return await sessionService.createSession(sessionData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSessionStatus = createAsyncThunk(
  'sessions/updateStatus',
  async ({ sessionId, status }: { sessionId: string; status: SessionStatus }, { rejectWithValue }) => {
    try {
      return await sessionService.updateSessionStatus(sessionId, status);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSessionById = createAsyncThunk(
  'sessions/fetchById',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      return await sessionService.getSessionById(sessionId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearSessions: (state) => {
      state.sessions = [];
      state.currentSession = null;
      state.error = null;
    },
    setCurrentSession: (state, action: PayloadAction<Session | null>) => {
      state.currentSession = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action: PayloadAction<Session[]>) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create session
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action: PayloadAction<Session>) => {
        state.loading = false;
        state.sessions.push(action.payload);
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update session status
      .addCase(updateSessionStatus.fulfilled, (state, action: PayloadAction<Session>) => {
        const index = state.sessions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession?.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      })
      // Fetch session by ID
      .addCase(fetchSessionById.fulfilled, (state, action: PayloadAction<Session>) => {
        state.currentSession = action.payload;
      });
  },
});

export const { clearSessions, setCurrentSession, clearError } = sessionSlice.actions;
export default sessionSlice.reducer;
