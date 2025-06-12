import { ApiResponse, FollowStats, FollowUser, UserProfile } from '../types';
import { ApiService } from './apiService';

export const followService = {
  // Follow a user
  followUser: async (followingId: string): Promise<void> => {
    try {
      const response = await ApiService.post<ApiResponse<any>>('/follows', { followingId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Follow user error:', error);
      throw error;
    }
  },

  // Unfollow a user
  unfollowUser: async (followingId: string): Promise<void> => {
    try {
      const response = await ApiService.delete<ApiResponse<any>>(`/follows/${followingId}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to unfollow user');
      }
    } catch (error) {
      console.error('Unfollow user error:', error);
      throw error;
    }
  },

  // Get followers of a user
  getFollowers: async (userId: string, page = 1, limit = 20): Promise<{
    data: FollowUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }> => {
    try {
      const response = await ApiService.get<ApiResponse<{
        data: FollowUser[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        }
      }>>(`/follows/${userId}/followers?page=${page}&limit=${limit}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get followers');
    } catch (error) {
      console.error('Get followers error:', error);
      throw error;
    }
  },

  // Get users that a user is following
  getFollowing: async (userId: string, page = 1, limit = 20): Promise<{
    data: FollowUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }> => {
    try {
      const response = await ApiService.get<ApiResponse<{
        data: FollowUser[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        }
      }>>(`/follows/${userId}/following?page=${page}&limit=${limit}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get following');
    } catch (error) {
      console.error('Get following error:', error);
      throw error;
    }
  },

  // Check if current user is following another user
  checkFollowStatus: async (followingId: string): Promise<{ isFollowing: boolean }> => {
    try {
      const response = await ApiService.get<ApiResponse<{ isFollowing: boolean }>>(`/follows/check/${followingId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to check follow status');
    } catch (error) {
      console.error('Check follow status error:', error);
      throw error;
    }
  },

  // Get follow statistics for a user
  getFollowStats: async (userId: string): Promise<FollowStats> => {
    try {
      const response = await ApiService.get<ApiResponse<FollowStats>>(`/follows/${userId}/stats`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get follow stats');
    } catch (error) {
      console.error('Get follow stats error:', error);
      throw error;
    }
  },

  // Get mutual follows (users that both current user and target user follow)
  getMutualFollows: async (userId: string): Promise<UserProfile[]> => {
    try {
      const response = await ApiService.get<ApiResponse<UserProfile[]>>(`/follows/${userId}/mutual`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get mutual follows');
    } catch (error) {
      console.error('Get mutual follows error:', error);
      throw error;
    }
  }
};
