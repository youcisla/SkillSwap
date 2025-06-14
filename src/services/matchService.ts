import { ApiResponse, Match, Session, UserProfile } from '../types';
import { ApiService } from './apiService';

interface MatchFilters {
  maxDistance?: number;
  skillCategories?: string[];
  minCompatibilityScore?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface DynamicMatch {
  user: UserProfile;
  compatibilityScore: number;
  sharedSkills: {
    canTeach: string[];
    canLearnFrom: string[];
  };
  distance?: number;
  matchReasons: string[];
}

class MatchService {
  async getMatches(userId: string): Promise<Match[]> {
    try {
      const response = await ApiService.get<ApiResponse<Match[]>>(`/matches/user/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get matches');
    } catch (error) {
      console.error('Get matches error:', error);
      throw error;
    }
  }

  async createMatch(matchData: Omit<Match, 'id' | 'createdAt'>): Promise<Match> {
    try {
      const response = await ApiService.post<ApiResponse<Match>>('/matches', matchData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to create match');
    } catch (error) {
      console.error('Create match error:', error);
      throw error;
    }
  }

  // NEW: Dynamic matching based on current user skills and preferences
  async findDynamicMatches(userId: string, filters: MatchFilters = {}): Promise<DynamicMatch[]> {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('userId', userId);
      
      if (filters.maxDistance) {
        queryParams.append('maxDistance', filters.maxDistance.toString());
      }
      
      if (filters.skillCategories?.length) {
        filters.skillCategories.forEach(category => 
          queryParams.append('skillCategories', category)
        );
      }
      
      if (filters.minCompatibilityScore) {
        queryParams.append('minCompatibilityScore', filters.minCompatibilityScore.toString());
      }

      if (filters.location) {
        queryParams.append('latitude', filters.location.latitude.toString());
        queryParams.append('longitude', filters.location.longitude.toString());
      }

      console.log('🔍 Finding dynamic matches with filters:', filters);

      const response = await ApiService.get<ApiResponse<DynamicMatch[]>>(
        `/matches/dynamic?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        console.log('✅ Found dynamic matches:', response.data.length);
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to find dynamic matches');
    } catch (error) {
      console.error('Find dynamic matches error:', error);
      throw error;
    }
  }

  // NEW: Calculate local compatibility score
  calculateCompatibilityScore(
    myTeachSkills: string[], 
    myLearnSkills: string[], 
    theirTeachSkills: string[], 
    theirLearnSkills: string[]
  ): { score: number; canTeach: string[]; canLearnFrom: string[] } {
    const canTeach = myTeachSkills.filter(skill => 
      theirLearnSkills.some(theirSkill => 
        theirSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(theirSkill.toLowerCase())
      )
    );
    
    const canLearnFrom = theirTeachSkills.filter(skill => 
      myLearnSkills.some(mySkill => 
        mySkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(mySkill.toLowerCase())
      )
    );

    const totalMySkills = myTeachSkills.length + myLearnSkills.length;
    const totalMatches = canTeach.length + canLearnFrom.length;
    
    const score = totalMySkills > 0 ? Math.round((totalMatches / totalMySkills) * 100) : 0;
    
    return { score, canTeach, canLearnFrom };
  }

  async findPotentialMatches(userId: string, filters?: {
    maxDistance?: number;
    skillCategories?: string[];
    minCompatibilityScore?: number;
  }): Promise<Match[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.maxDistance) {
        queryParams.append('maxDistance', filters.maxDistance.toString());
      }
      
      if (filters?.skillCategories) {
        filters.skillCategories.forEach(category => 
          queryParams.append('skillCategories', category)
        );
      }
      
      if (filters?.minCompatibilityScore) {
        queryParams.append('minCompatibilityScore', filters.minCompatibilityScore.toString());
      }

      const response = await ApiService.get<ApiResponse<Match[]>>(
        `/matches/find/${userId}?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to find potential matches');
    } catch (error) {
      console.error('Find potential matches error:', error);
      throw error;
    }
  }

  async updateMatch(matchId: string, updates: Partial<Match>): Promise<Match> {
    try {
      const response = await ApiService.put<ApiResponse<Match>>(`/matches/${matchId}`, updates);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update match');
    } catch (error) {
      console.error('Update match error:', error);
      throw error;
    }
  }

  async deleteMatch(matchId: string): Promise<void> {
    try {
      const response = await ApiService.delete<ApiResponse<void>>(`/matches/${matchId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete match');
      }
    } catch (error) {
      console.error('Delete match error:', error);
      throw error;
    }
  }

  async getMatchDetails(matchId: string): Promise<Match> {
    try {
      const response = await ApiService.get<ApiResponse<Match>>(`/matches/${matchId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get match details');
    } catch (error) {
      console.error('Get match details error:', error);
      throw error;
    }
  }

  // NEW: Create session request
  async requestSession(sessionData: {
    teacherId: string;
    studentId: string; 
    skillId: string;
    scheduledAt: Date;
    location?: string;
    notes?: string;
  }): Promise<Session> {
    try {
      console.log('🎯 Creating session request:', sessionData);
      
      const response = await ApiService.post<ApiResponse<Session>>('/sessions', sessionData);
      
      if (response.success && response.data) {
        console.log('✅ Session request created successfully');
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to create session request');
    } catch (error) {
      console.error('Create session request error:', error);
      throw error;
    }
  }
}

export const matchService = new MatchService();
