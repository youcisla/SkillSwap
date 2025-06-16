import { ApiResponse, Session, SessionStatus } from '../types';
import { ApiService } from './apiService';

class SessionService {
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const response = await ApiService.get<ApiResponse<Session[]>>(`/sessions/user/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get user sessions');
    } catch (error) {
      console.error('Get user sessions error:', error);
      throw error;
    }
  }

  async createSession(sessionData: Omit<Session, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Session> {
    try {
      const response = await ApiService.post<ApiResponse<Session>>('/sessions', sessionData);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to create session');
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  async getSessionById(sessionId: string): Promise<Session> {
    try {
      const response = await ApiService.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get session');
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<Session> {
    try {
      const response = await ApiService.put<ApiResponse<Session>>(
        `/sessions/${sessionId}/status`,
        { status }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update session status');
    } catch (error) {
      console.error('Update session status error:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session> {
    try {
      const response = await ApiService.put<ApiResponse<Session>>(`/sessions/${sessionId}`, updates);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update session');
    } catch (error) {
      console.error('Update session error:', error);
      throw error;
    }
  }

  async cancelSession(sessionId: string, reason?: string): Promise<Session> {
    try {
      const response = await ApiService.put<ApiResponse<Session>>(
        `/sessions/${sessionId}/cancel`,
        { reason }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to cancel session');
    } catch (error) {
      console.error('Cancel session error:', error);
      throw error;
    }
  }

  async completeSession(sessionId: string, feedback?: {
    rating: number;
    comment: string;
  }): Promise<Session> {
    try {
      const response = await ApiService.put<ApiResponse<Session>>(
        `/sessions/${sessionId}/complete`,
        { feedback }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to complete session');
    } catch (error) {
      console.error('Complete session error:', error);
      throw error;
    }
  }

  async getUpcomingSessions(userId: string): Promise<Session[]> {
    try {
      const response = await ApiService.get<ApiResponse<Session[]>>(
        `/sessions/user/${userId}/upcoming`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get upcoming sessions');
    } catch (error) {
      console.error('Get upcoming sessions error:', error);
      throw error;
    }
  }

  async getPastSessions(userId: string): Promise<Session[]> {
    try {
      const response = await ApiService.get<ApiResponse<Session[]>>(
        `/sessions/user/${userId}/past`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get past sessions');
    } catch (error) {
      console.error('Get past sessions error:', error);
      throw error;
    }
  }
}

export const sessionService = new SessionService();
