import { ApiResponse, Match } from '../types';
import { ApiService } from './apiService';

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
}

export const matchService = new MatchService();
