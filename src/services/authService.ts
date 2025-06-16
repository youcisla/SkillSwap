import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, LoginForm, RegisterForm, User } from '../types';
import { ApiService } from './apiService';

class AuthService {
  async login(credentials: LoginForm): Promise<{ user: User; token: string }> {
    try {
      const response = await ApiService.post<ApiResponse<{ user: User; token: string }>>(
        '/auth/login',
        credentials
      );
      
      console.log('🔍 Login response:', response);
      console.log('🔍 User data:', response.data?.user);
      
      if (response.success && response.data) {
        // Check if user has id field, if not use _id
        const userId = response.data.user.id || (response.data.user as any)._id;
        console.log('💾 Storing userId:', userId);
        
        // Store token in AsyncStorage
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', userId);
        
        // Ensure user object has id field for frontend
        if (!response.data.user.id && (response.data.user as any)._id) {
          response.data.user.id = (response.data.user as any)._id;
        }
        
        console.log('✅ Login data stored successfully:', {
          token: response.data.token ? 'present' : 'missing',
          userId: userId,
          userName: response.data.user.name
        });
        
        return response.data;
      }
      
      throw new Error(response.error || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterForm): Promise<{ user: User; token: string }> {
    try {
      const response = await ApiService.post<ApiResponse<{ user: User; token: string }>>(
        '/auth/register',
        userData
      );
      
      if (response.success && response.data) {
        // Store token in AsyncStorage
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.user.id);
        return response.data;
      }
      
      throw new Error(response.error || 'Registration failed');
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userId']);
      await ApiService.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear local storage
      await AsyncStorage.multiRemove(['authToken', 'userId']);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return null;
      }

      const response = await ApiService.get<ApiResponse<User>>('/auth/me');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // If API call fails, clear stored data and return null
      await this.logout();
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      // Clear stored data on error
      await this.logout();
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Get stored token error:', error);
      return null;
    }
  }

  async getStoredUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('userId');
    } catch (error) {
      console.error('Get stored user ID error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
