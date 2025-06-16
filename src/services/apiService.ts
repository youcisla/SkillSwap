import AsyncStorage from '@react-native-async-storage/async-storage';

// Declare global __DEV__ variable for TypeScript
declare const __DEV__: boolean;

// API Base URL configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode - check platform
    const Platform = require('react-native').Platform;
    const Constants = require('expo-constants').default;
    const DEVELOPMENT_IP = '192.168.1.93'; // Your WiFi IP address

    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    } else if (Platform.OS === 'android') {
      const isEmulator = Constants.isDevice === false;
      if (isEmulator) {
        return 'http://10.0.2.2:3000/api';
      } else {
        return `http://${DEVELOPMENT_IP}:3000/api`;
      }
    } else if (Platform.OS === 'ios') {
      const isSimulator = Constants.isDevice === false;
      if (isSimulator) {
        return 'http://localhost:3000/api';
      } else {
        return `http://${DEVELOPMENT_IP}:3000/api`;
      }
    } else {
      return `http://${DEVELOPMENT_IP}:3000/api`;
    }
  } else {
    return 'https://your-skillswap-backend.herokuapp.com/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Server status tracking
let serverStatus: 'online' | 'offline' | 'checking' = 'online';

// Helper function to check server status
const checkServerStatus = async (): Promise<boolean> => {
  try {
    serverStatus = 'checking';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const isOnline = response.ok;
    serverStatus = isOnline ? 'online' : 'offline';
    return isOnline;
  } catch (error) {
    serverStatus = 'offline';
    return false;
  }
};

interface ApiRequestOptions extends Omit<RequestInit, 'signal'> {
  timeout?: number;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('authToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { timeout = 10000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...headers,
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      serverStatus = 'online';
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (
        error instanceof Error &&
        (
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed') ||
          error.message.includes('ERR_CONNECTION_REFUSED')
        )
      ) {
        const isServerOnline = await checkServerStatus();

        if (!isServerOnline) {
          throw new Error(
            '🔌 Backend server is not running!\n\n' +
            '💡 To start the server:\n' +
            '1. Open terminal in backend folder\n' +
            '2. Run: npm install\n' +
            '3. Run: npm start\n' +
            '4. Server should start on http://localhost:3000\n\n' +
            `🌐 Trying to connect to: ${API_BASE_URL}`
          );
        }

        throw new Error('Network error - please check your internet connection and server status');
      }

      throw error;
    }
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      console.log(`🌐 API UPLOAD: ${this.baseURL}${endpoint}`);
      const token = await AsyncStorage.getItem('authToken');

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Note: Don't set Content-Type for FormData, let the browser set it with boundary

      const response = await fetch(`${this.baseURL}${endpoint}`, {
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

  async checkServerHealth(): Promise<{ online: boolean; status: string; url: string }> {
    const isOnline = await checkServerStatus();
    return {
      online: isOnline,
      status: serverStatus,
      url: this.baseURL,
    };
  }

  getApiUrl(): string {
    return this.baseURL;
  }

  // Static methods for backward compatibility
  static async checkServerHealth(): Promise<{ online: boolean; status: string; url: string }> {
    return apiService.checkServerHealth();
  }

  static getApiUrl(): string {
    return apiService.getApiUrl();
  }

  // Static HTTP methods for backward compatibility
  static async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return apiService.get<T>(endpoint, options);
  }

  static async post<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return apiService.post<T>(endpoint, data, options);
  }

  static async put<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return apiService.put<T>(endpoint, data, options);
  }

  static async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return apiService.delete<T>(endpoint, options);
  }

  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    return apiService.uploadFile<T>(endpoint, formData);
  }
}

// Create and export the default instance
export const apiService = new ApiService();

// Export the class for type usage and inheritance
export { ApiService };

// Default export for backward compatibility
export default apiService;
