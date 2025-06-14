import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { matchService } from '../../services/matchService';
import { Match } from '../../types';

interface DynamicMatch {
  user: any;
  compatibilityScore: number;
  sharedSkills: {
    canTeach: string[];
    canLearnFrom: string[];
  };
  distance?: number;
  matchReasons: string[];
}

interface MatchState {
  matches: Match[];
  dynamicMatches: DynamicMatch[];
  loading: boolean;
  dynamicLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: MatchState = {
  matches: [],
  dynamicMatches: [],
  loading: false,
  dynamicLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchMatches = createAsyncThunk(
  'matches/fetchMatches',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await matchService.getMatches(userId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// NEW: Dynamic matching thunk
export const findDynamicMatches = createAsyncThunk(
  'matches/findDynamicMatches',
  async (params: {
    userId: string;
    filters?: {
      maxDistance?: number;
      skillCategories?: string[];
      minCompatibilityScore?: number;
      location?: { latitude: number; longitude: number };
    };
  }, { rejectWithValue }) => {
    try {
      console.log('🔍 Finding dynamic matches for user:', params.userId);
      const dynamicMatches = await matchService.findDynamicMatches(params.userId, params.filters);
      console.log('✅ Found dynamic matches:', dynamicMatches.length);
      return dynamicMatches;
    } catch (error: any) {
      console.error('❌ Dynamic matching failed:', error);
      // Return empty array instead of rejecting to prevent blocking UI
      console.warn('Returning empty dynamic matches due to error');
      return [];
    }
  }
);

export const createMatch = createAsyncThunk(
  'matches/createMatch',
  async (matchData: Omit<Match, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      return await matchService.createMatch(matchData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeMatch = createAsyncThunk(
  'matches/removeMatch',
  async (matchId: string, { rejectWithValue }) => {
    try {
      await matchService.deleteMatch(matchId);
      return matchId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const matchSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    clearMatches: (state) => {
      state.matches = [];
      state.dynamicMatches = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDynamicMatches: (state) => {
      state.dynamicMatches = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch matches
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action: PayloadAction<Match[]>) => {
        state.loading = false;
        state.matches = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Dynamic matches
      .addCase(findDynamicMatches.pending, (state) => {
        state.dynamicLoading = true;
        state.error = null;
      })
      .addCase(findDynamicMatches.fulfilled, (state, action: PayloadAction<DynamicMatch[]>) => {
        state.dynamicLoading = false;
        state.dynamicMatches = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(findDynamicMatches.rejected, (state, action) => {
        state.dynamicLoading = false;
        state.error = action.payload as string;
      })
      // Create match
      .addCase(createMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMatch.fulfilled, (state, action: PayloadAction<Match>) => {
        state.loading = false;
        state.matches.push(action.payload);
      })
      .addCase(createMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove match
      .addCase(removeMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMatch.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.matches = state.matches.filter(match => match.id !== action.payload);
      })
      .addCase(removeMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMatches, clearError, clearDynamicMatches } = matchSlice.actions;
export default matchSlice.reducer;
