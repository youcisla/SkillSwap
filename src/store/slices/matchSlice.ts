import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { matchService } from '../../services/matchService';
import { Match, MatchState } from '../../types';

const initialState: MatchState = {
  matches: [],
  loading: false,
  error: null,
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

const matchSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    clearMatches: (state) => {
      state.matches = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
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
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
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
      });
  },
});

export const { clearMatches, clearError } = matchSlice.actions;
export default matchSlice.reducer;
