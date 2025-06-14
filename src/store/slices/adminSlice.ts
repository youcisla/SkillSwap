import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminAnalytics, AdminDashboardData, adminService, AdminSession, AdminSkill, AdminUser } from '../../services/adminService';

interface AdminState {
  dashboard: AdminDashboardData | null;
  users: {
    data: AdminUser[];
    pagination: any;
    loading: boolean;
  };
  skills: {
    data: AdminSkill[];
    pagination: any;
    loading: boolean;
  };
  sessions: {
    data: AdminSession[];
    pagination: any;
    loading: boolean;
  };
  analytics: AdminAnalytics | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  dashboard: null,
  users: {
    data: [],
    pagination: null,
    loading: false,
  },
  skills: {
    data: [],
    pagination: null,
    loading: false,
  },
  sessions: {
    data: [],
    pagination: null,
    loading: false,
  },
  analytics: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async () => {
    return await adminService.getDashboard();
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params: Parameters<typeof adminService.getUsers>[0] = {}) => {
    return await adminService.getUsers(params);
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, updates }: { userId: string; updates: Parameters<typeof adminService.updateUser>[1] }) => {
    return await adminService.updateUser(userId, updates);
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId: string) => {
    await adminService.deleteUser(userId);
    return userId;
  }
);

export const fetchSkills = createAsyncThunk(
  'admin/fetchSkills',
  async (params: Parameters<typeof adminService.getSkills>[0] = {}) => {
    return await adminService.getSkills(params);
  }
);

export const updateSkill = createAsyncThunk(
  'admin/updateSkill',
  async ({ skillId, updates }: { skillId: string; updates: Parameters<typeof adminService.updateSkill>[1] }) => {
    return await adminService.updateSkill(skillId, updates);
  }
);

export const deleteSkill = createAsyncThunk(
  'admin/deleteSkill',
  async (skillId: string) => {
    await adminService.deleteSkill(skillId);
    return skillId;
  }
);

export const fetchSessions = createAsyncThunk(
  'admin/fetchSessions',
  async (params: Parameters<typeof adminService.getSessions>[0] = {}) => {
    return await adminService.getSessions(params);
  }
);

export const updateSession = createAsyncThunk(
  'admin/updateSession',
  async ({ sessionId, updates }: { sessionId: string; updates: Parameters<typeof adminService.updateSession>[1] }) => {
    return await adminService.updateSession(sessionId, updates);
  }
);

export const fetchAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (period: Parameters<typeof adminService.getAnalytics>[0] = '30d') => {
    return await adminService.getAnalytics(period);
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUsersLoading: (state, action: PayloadAction<boolean>) => {
      state.users.loading = action.payload;
    },
    setSkillsLoading: (state, action: PayloadAction<boolean>) => {
      state.skills.loading = action.payload;
    },
    setSessionsLoading: (state, action: PayloadAction<boolean>) => {
      state.sessions.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard';
      })

      // Users
      .addCase(fetchUsers.pending, (state) => {
        state.users.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.data = action.payload.users;
        state.users.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.data.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users.data[index] = action.payload;
        }
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users.data = state.users.data.filter(user => user.id !== action.payload);
      })

      // Skills
      .addCase(fetchSkills.pending, (state) => {
        state.skills.loading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.skills.loading = false;
        state.skills.data = action.payload.skills;
        state.skills.pagination = action.payload.pagination;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.skills.loading = false;
        state.error = action.error.message || 'Failed to fetch skills';
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        const index = state.skills.data.findIndex(skill => skill.id === action.payload.id);
        if (index !== -1) {
          state.skills.data[index] = action.payload;
        }
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.skills.data = state.skills.data.filter(skill => skill.id !== action.payload);
      })

      // Sessions
      .addCase(fetchSessions.pending, (state) => {
        state.sessions.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessions.loading = false;
        state.sessions.data = action.payload.sessions;
        state.sessions.pagination = action.payload.pagination;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.sessions.loading = false;
        state.error = action.error.message || 'Failed to fetch sessions';
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        const index = state.sessions.data.findIndex(session => session.id === action.payload.id);
        if (index !== -1) {
          state.sessions.data[index] = action.payload;
        }
      })

      // Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch analytics';
      });
  },
});

export const { clearError, setUsersLoading, setSkillsLoading, setSessionsLoading } = adminSlice.actions;
export default adminSlice.reducer;
