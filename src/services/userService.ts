import { ApiResponse, ProfileForm, UserProfile } from '../types';
import { ApiService } from './apiService';

class UserService {
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await ApiService.get<ApiResponse<UserProfile>>(`/users/${userId}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      const errorMessage = response.error || 'Failed to get user profile';
      throw new Error(errorMessage);
    } catch (error) {
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
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const fileType = filename.split('.').pop() || 'jpg';
      
      formData.append('profileImage', {
        uri: imageUri,
        type: `image/${fileType}`,
        name: filename,
      } as any);

      const response = await ApiService.uploadFile<any>(`/users/${userId}/upload-image`, formData);
      
      if (response.success && response.data && response.data.profileImage) {
        return response.data.profileImage;
      }
      
      const errorMessage = response.error || response.message || 'Failed to upload image';
      console.error('UserService: Upload failed:', errorMessage);
      throw new Error(errorMessage);
    } catch (error) {
      console.error('UserService: Upload profile image error:', error);
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
      
      // Only add query if it's not empty
      if (query && query.trim()) {
        queryParams.append('search', query.trim());
      }
      
      if (filters?.city && filters.city.trim()) {
        queryParams.append('location', filters.city.trim());
      }
      
      if (filters?.skillsToTeach && filters.skillsToTeach.length > 0) {
        filters.skillsToTeach
          .filter(skill => skill && skill.trim())
          .forEach(skill => queryParams.append('skills', skill.trim()));
      }
      
      if (filters?.skillsToLearn && filters.skillsToLearn.length > 0) {
        filters.skillsToLearn
          .filter(skill => skill && skill.trim())
          .forEach(skill => queryParams.append('skills', skill.trim()));
      }

      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('UserService: Making request to:', url);

      const response = await ApiService.get<ApiResponse<UserProfile[]>>(url);
      
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
