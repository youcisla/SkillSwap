import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode - check platform
    const Platform = require('react-native').Platform;
    
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';  // Web/Browser
    } else if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api';   // Android Emulator
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:3000/api';   // iOS Simulator
    } else {
      // Physical device - Updated with your actual IP
      return 'http://192.168.1.93:3000/api'; // Your computer's IP address
    }
  } else {
    // Production
    return 'https://your-skillswap-backend.herokuapp.com/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

export class ApiService {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  static async get<T>(endpoint: string): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('API request timed out:', endpoint);
        throw new Error('Request timed out. Please check your connection.');
      }
      console.error('API GET Error:', error);
      throw error;
    }
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      console.log(`🌐 API POST: ${API_BASE_URL}${endpoint}`);
      console.log('📤 Request data:', JSON.stringify(data, null, 2));
      
      const headers = await this.getAuthHeaders();
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ API Success Response:', responseData);
      return responseData;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('⏰ API request timed out:', endpoint);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      if (error.message === 'Network request failed') {
        console.error('🌐 Network Error - Check if backend is running and URL is correct');
        console.error('Current API URL:', API_BASE_URL);
        throw new Error('Network request failed. Please check if the backend server is running and you\'re connected to the right network.');
      }
      
      console.error('❌ API POST Error:', error);
      throw error;
    }
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  }

  static async delete<T>(endpoint: string): Promise<T> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }
}
