import { ApiResponse, ProfileForm, UserProfile } from '../types';
import { ApiService } from './apiService';

class UserService {
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await ApiService.get<ApiResponse<UserProfile>>(`/users/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get user profile');
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, profileData: ProfileForm): Promise<UserProfile> {
    try {
      const response = await ApiService.put<ApiResponse<UserProfile>>(
        `/users/${userId}`,
        profileData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await fetch(`${ApiService['API_BASE_URL']}/users/${userId}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add auth headers
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data.imageUrl;
      }
      
      throw new Error(data.error || 'Failed to upload image');
    } catch (error) {
      console.error('Upload profile image error:', error);
      throw error;
    }
  }

  async searchUsers(query: string, filters?: {
    city?: string;
    skillsToTeach?: string[];
    skillsToLearn?: string[];
  }): Promise<UserProfile[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      
      if (filters?.city) {
        queryParams.append('city', filters.city);
      }
      
      if (filters?.skillsToTeach) {
        filters.skillsToTeach.forEach(skill => 
          queryParams.append('skillsToTeach', skill)
        );
      }
      
      if (filters?.skillsToLearn) {
        filters.skillsToLearn.forEach(skill => 
          queryParams.append('skillsToLearn', skill)
        );
      }

      const response = await ApiService.get<ApiResponse<UserProfile[]>>(
        `/users/search?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to search users');
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  async getUsersBySkill(skillId: string): Promise<UserProfile[]> {
    try {
      const response = await ApiService.get<ApiResponse<UserProfile[]>>(
        `/users/by-skill/${skillId}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get users by skill');
    } catch (error) {
      console.error('Get users by skill error:', error);
      throw error;
    }
  }

  async getNearbyUsers(latitude: number, longitude: number, radius: number = 10): Promise<UserProfile[]> {
    try {
      const response = await ApiService.get<ApiResponse<UserProfile[]>>(
        `/users/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get nearby users');
    } catch (error) {
      console.error('Get nearby users error:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
