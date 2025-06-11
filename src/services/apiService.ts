import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode - check platform
    const Platform = require('react-native').Platform;
    const Constants = require('expo-constants').default;
    
    // Get your computer's IP address from environment or use default
    const DEVELOPMENT_IP = '192.168.1.93'; // Your WiFi IP address
    
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';  // Web/Browser
    } else if (Platform.OS === 'android') {
      // Check if running on emulator or physical device
      const isEmulator = Constants.isDevice === false;
      if (isEmulator) {
        return 'http://10.0.2.2:3000/api';   // Android Emulator
      } else {
        return `http://${DEVELOPMENT_IP}:3000/api`; // Android Physical Device
      }
    } else if (Platform.OS === 'ios') {
      // Check if running on simulator or physical device
      const isSimulator = Constants.isDevice === false;
      if (isSimulator) {
        return 'http://localhost:3000/api';   // iOS Simulator
      } else {
        return `http://${DEVELOPMENT_IP}:3000/api`; // iOS Physical Device
      }
    } else {
      // Fallback for other platforms
      return `http://${DEVELOPMENT_IP}:3000/api`;
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
      console.log(`🌐 API GET: ${API_BASE_URL}${endpoint}`);
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
        console.error(`❌ API GET Error: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API GET Success: ${endpoint}`);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ API GET Timeout:', endpoint);
        throw new Error('Request timeout - please check your network connection');
      }
      
      console.error('❌ API GET Error:', {
        endpoint,
        url: `${API_BASE_URL}${endpoint}`,
        error: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.message.includes('Network request failed') || 
          error.message.includes('fetch')) {
        throw new Error('Network error - please check your internet connection and server status');
      }
      
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

  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      console.log(`🌐 API UPLOAD: ${API_BASE_URL}${endpoint}`);
      const token = await AsyncStorage.getItem('authToken');
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Note: Don't set Content-Type for FormData, let the browser set it with boundary
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('API UPLOAD Error:', error);
      throw error;
    }
  }
}
