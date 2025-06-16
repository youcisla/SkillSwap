import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { followService } from '../../services/followService';
import { FollowState, FollowStats, FollowUser, UserProfile } from '../../types';

const initialState: FollowState = {
  followers: [],
  following: [],
  mutualFollows: [],
  followStats: null,
  isFollowing: {},
  loading: false,
  error: null,
};

// Async thunks
export const followUser = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('follow/followUser', async (followingId, { rejectWithValue }) => {
  try {
    await followService.followUser(followingId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to follow user');
  }
});

export const unfollowUser = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('follow/unfollowUser', async (followingId, { rejectWithValue }) => {
  try {
    await followService.unfollowUser(followingId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to unfollow user');
  }
});

export const fetchFollowers = createAsyncThunk<
  {
    data: FollowUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  },
  { userId: string; page?: number; limit?: number },
  { rejectValue: string }
>('follow/fetchFollowers', async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
  try {
    return await followService.getFollowers(userId, page, limit);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch followers');
  }
});

export const fetchFollowing = createAsyncThunk<
  {
    data: FollowUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  },
  { userId: string; page?: number; limit?: number },
  { rejectValue: string }
>('follow/fetchFollowing', async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
  try {
    return await followService.getFollowing(userId, page, limit);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch following');
  }
});

export const checkFollowStatus = createAsyncThunk<
  { userId: string; isFollowing: boolean },
  string,
  { rejectValue: string }
>('follow/checkFollowStatus', async (followingId, { rejectWithValue }) => {
  try {
    const result = await followService.checkFollowStatus(followingId);
    return { userId: followingId, isFollowing: result.isFollowing };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to check follow status');
  }
});

export const fetchFollowStats = createAsyncThunk<
  FollowStats,
  string,
  { rejectValue: string }
>('follow/fetchFollowStats', async (userId, { rejectWithValue }) => {
  try {
    return await followService.getFollowStats(userId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch follow stats');
  }
});

export const fetchMutualFollows = createAsyncThunk<
  UserProfile[],
  string,
  { rejectValue: string }
>('follow/fetchMutualFollows', async (userId, { rejectWithValue }) => {
  try {
    return await followService.getMutualFollows(userId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch mutual follows');
  }
});

const followSlice = createSlice({
  name: 'follow',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearFollowData: (state) => {
      state.followers = [];
      state.following = [];
      state.mutualFollows = [];
      state.followStats = null;
      state.isFollowing = {};
    },
    setFollowStatus: (state, action: PayloadAction<{ userId: string; isFollowing: boolean }>) => {
      state.isFollowing[action.payload.userId] = action.payload.isFollowing;
    },
  },
  extraReducers: (builder) => {
    builder
      // Follow user
      .addCase(followUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.loading = false;
        // The followingId is in the action meta
        const followingId = (action as any).meta.arg;
        state.isFollowing[followingId] = true;
        
        // Update follow stats if available
        if (state.followStats) {
          state.followStats.followingCount += 1;
        }
      })
      .addCase(followUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to follow user';
      })
      
      // Unfollow user
      .addCase(unfollowUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.loading = false;
        // The followingId is in the action meta
        const followingId = (action as any).meta.arg;
        state.isFollowing[followingId] = false;
        
        // Update follow stats if available
        if (state.followStats) {
          state.followStats.followingCount -= 1;
        }
        
        // Remove from following list if present
        state.following = state.following.filter(user => user.id !== followingId);
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to unfollow user';
      })
      
      // Fetch followers
      .addCase(fetchFollowers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.loading = false;
        state.followers = action.payload.data;
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch followers';
      })
      
      // Fetch following
      .addCase(fetchFollowing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.loading = false;
        state.following = action.payload.data;
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch following';
      })
      
      // Check follow status
      .addCase(checkFollowStatus.pending, (state) => {
        // Don't set loading for status checks as they're often background operations
        state.error = null;
      })
      .addCase(checkFollowStatus.fulfilled, (state, action) => {
        state.isFollowing[action.payload.userId] = action.payload.isFollowing;
      })
      .addCase(checkFollowStatus.rejected, (state, action) => {
        state.error = action.payload || 'Failed to check follow status';
      })
      
      // Fetch follow stats
      .addCase(fetchFollowStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFollowStats.fulfilled, (state, action) => {
        state.loading = false;
        state.followStats = action.payload;
      })
      .addCase(fetchFollowStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch follow stats';
      })
      
      // Fetch mutual follows
      .addCase(fetchMutualFollows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMutualFollows.fulfilled, (state, action) => {
        state.loading = false;
        state.mutualFollows = action.payload;
      })
      .addCase(fetchMutualFollows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch mutual follows';
      });
  },
});

export const { clearError, clearFollowData, setFollowStatus } = followSlice.actions;
export default followSlice.reducer;
