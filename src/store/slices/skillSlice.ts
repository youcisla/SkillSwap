import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { skillService } from '../../services/skillService';
import { Skill, SkillForm, SkillState } from '../../types';

const initialState: SkillState = {
  skills: [],
  categories: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserSkills = createAsyncThunk<
  { teach: Skill[]; learn: Skill[] },
  string,
  { rejectValue: string }
>('skills/fetchUserSkills', async (userId, { rejectWithValue }) => {
  try {
    return await skillService.getUserSkills(userId);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch skills');
  }
});

export const addSkill = createAsyncThunk<
  Skill,
  { userId: string; skill: SkillForm; type: 'teach' | 'learn' },
  { rejectValue: string }
>('skills/addSkill', async ({ userId, skill, type }, { rejectWithValue }) => {
  try {
    return await skillService.addSkill(userId, skill, type);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to add skill');
  }
});

export const updateSkill = createAsyncThunk<
  Skill,
  { skillId: string; skill: Partial<SkillForm> },
  { rejectValue: string }
>('skills/updateSkill', async ({ skillId, skill }, { rejectWithValue }) => {
  try {
    return await skillService.updateSkill(skillId, skill);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to update skill');
  }
});

export const removeSkill = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('skills/removeSkill', async (skillId, { rejectWithValue }) => {
  try {
    await skillService.deleteSkill(skillId);
    return skillId;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to remove skill');
  }
});

export const searchSkills = createAsyncThunk<
  Skill[],
  string,
  { rejectValue: string }
>('skills/search', async (query, { rejectWithValue }) => {
  try {
    return await skillService.searchSkills(query);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Search failed');
  }
});

const skillSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSkills: (state) => {
      state.skills = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user skills
      .addCase(fetchUserSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.skills = [...action.payload.teach, ...action.payload.learn];
      })
      .addCase(fetchUserSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch skills';
      })
      // Add skill
      .addCase(addSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSkill.fulfilled, (state, action) => {
        state.loading = false;
        
        // Ensure we have an id field
        const skillWithId = {
          ...action.payload,
          id: action.payload.id || (action.payload as any)._id
        };
        
        state.skills.push(skillWithId);
      })
      .addCase(addSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add skill';
      })
      // Update skill
      .addCase(updateSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.skills.findIndex(skill => skill.id === action.payload.id);
        if (index !== -1) {
          state.skills[index] = action.payload;
        }
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update skill';
      })
      // Remove skill
      .addCase(removeSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSkill.fulfilled, (state, action) => {
        state.loading = false;
        state.skills = state.skills.filter(skill => skill.id !== action.payload);
      })
      .addCase(removeSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove skill';
      })
      // Search skills
      .addCase(searchSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.skills = action.payload;
      })
      .addCase(searchSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Search failed';
      });
  },
});

export const { clearError, clearSkills } = skillSlice.actions;
export default skillSlice.reducer;
