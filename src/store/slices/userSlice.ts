import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { ProfileForm, UserProfile, UserState } from '../../types';

const initialState: UserState = {
  currentUser: null,
  users: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  string,
  { rejectValue: string }
>('user/fetchProfile', async (userId, { rejectWithValue }) => {
  try {
    return await userService.getUserProfile(userId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch user profile');
  }
});

export const updateUserProfile = createAsyncThunk<
  UserProfile,
  { userId: string; data: ProfileForm },
  { rejectValue: string }
>('user/updateProfile', async ({ userId, data }, { rejectWithValue }) => {
  try {
    return await userService.updateProfile(userId, data);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to update profile');
  }
});

export const fetchNearbyUsers = createAsyncThunk<
  UserProfile[],
  { latitude: number; longitude: number; radius?: number },
  { rejectValue: string }
>('user/fetchNearby', async ({ latitude, longitude, radius = 10 }, { rejectWithValue }) => {
  try {
    return await userService.getNearbyUsers(latitude, longitude, radius);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch nearby users');
  }
});

export const searchUsers = createAsyncThunk<
  UserProfile[],
  { query: string; filters?: any },
  { rejectValue: string }
>('user/search', async ({ query, filters }, { rejectWithValue }) => {
  try {
    return await userService.searchUsers(query, filters);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Search failed');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentUser: (state, action: PayloadAction<UserProfile>) => {
      state.currentUser = action.payload;
    },
    clearUsers: (state) => {
      state.users = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch profile';
      })
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
      })
      // Fetch nearby users
      .addCase(fetchNearbyUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchNearbyUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch nearby users';
      })
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Search failed';
      });
  },
});

export const { clearError, setCurrentUser, clearUsers } = userSlice.actions;
export default userSlice.reducer;
