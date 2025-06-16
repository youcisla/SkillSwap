// Enhanced API Service with caching, retry logic, and optimizations
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthenticationError, NetworkError, ValidationError } from '../utils/errorRecovery';

// Enhanced API Base URL configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    const Platform = require('react-native').Platform;
    const Constants = require('expo-constants').default;
    
    const DEVELOPMENT_IP = '192.168.1.93';
    
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    } else if (Platform.OS === 'android') {
      const isEmulator = Constants.isDevice === false;
      return isEmulator ? 'http://10.0.2.2:3000/api' : `http://${DEVELOPMENT_IP}:3000/api`;
    } else if (Platform.OS === 'ios') {
      const isSimulator = Constants.isDevice === false;
      return isSimulator ? 'http://localhost:3000/api' : `http://${DEVELOPMENT_IP}:3000/api`;
    }
    return `http://${DEVELOPMENT_IP}:3000/api`;
  }
  return 'https://your-skillswap-backend.herokuapp.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Request queue for managing concurrent requests
class RequestQueue {
  private queue: Array<{ url: string; promise: Promise<any> }> = [];
  private maxConcurrent = 5;

  async add<T>(url: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already in queue
    const existing = this.queue.find(req => req.url === url);
    if (existing) {
      return existing.promise;
    }

    // Wait if queue is full
    while (this.queue.length >= this.maxConcurrent) {
      await Promise.race(this.queue.map(req => req.promise));
    }

    const promise = requestFn().finally(() => {
      this.queue = this.queue.filter(req => req.url !== url);
    });

    this.queue.push({ url, promise });
    return promise;
  }
}

const requestQueue = new RequestQueue();

// Response cache with TTL
class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const responseCache = new ResponseCache();

// Cleanup cache every 5 minutes
setInterval(() => responseCache.cleanup(), 5 * 60 * 1000);

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
  maxRetries?: number;
  cache?: boolean;
  cacheTtl?: number;
}

export class EnhancedApiService {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private static createCacheKey(url: string, options: RequestOptions): string {
    const params = {
      url,
      method: options.method || 'GET',
      body: options.body,
    };
    return btoa(JSON.stringify(params));
  }

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = 15000,
      retry = true,
      maxRetries = 3,
      cache = method === 'GET',
      cacheTtl = 5 * 60 * 1000,
    } = options;

    const url = `${API_BASE_URL}${endpoint}`;
    const cacheKey = this.createCacheKey(url, options);

    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cached = responseCache.get(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit for ${endpoint}`);
        return cached;
      }
    }

    const requestFn = async (): Promise<T> => {
      const authHeaders = await this.getAuthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        console.log(`🌐 API ${method}: ${url}`);
        
        const requestInit: RequestInit = {
          method,
          headers: { ...authHeaders, ...headers },
          signal: controller.signal,
        };

        if (body && method !== 'GET') {
          if (typeof body === 'object') {
            requestInit.body = JSON.stringify(body);
          } else {
            requestInit.body = body;
          }
        }

        const response = await fetch(url, requestInit);
        clearTimeout(timeoutId);

        // Handle different response types
        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        const contentType = response.headers.get('content-type');
        let data: T;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = (await response.text()) as T;
        } else {
          data = (await response.blob()) as T;
        }

        // Cache successful GET responses
        if (cache && method === 'GET' && response.ok) {
          responseCache.set(cacheKey, data, cacheTtl);
        }

        console.log(`✅ API ${method} Success: ${endpoint}`);
        return data;

      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new NetworkError(`Request timeout after ${timeout}ms`, 408);
        }
        
        if (error.message?.includes('Network request failed')) {
          throw new NetworkError('Network error - please check your connection');
        }
        
        throw error;
      }
    };

    // Use request queue to manage concurrent requests
    return requestQueue.add(url, async () => {
      if (retry) {
        return this.executeWithRetry(requestFn, maxRetries);
      }
      return requestFn();
    });
  }

  private static async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: response.statusText };
    }

    const message = errorData.error || errorData.message || `HTTP ${response.status}`;

    switch (response.status) {
      case 400:
        throw new ValidationError(message, errorData.field);
      case 401:
        // Clear auth token on unauthorized
        await AsyncStorage.removeItem('authToken');
        throw new AuthenticationError(message);
      case 403:
        throw new Error('Access forbidden');
      case 404:
        throw new Error('Resource not found');
      case 429:
        throw new Error('Too many requests - please wait');
      case 500:
        throw new Error('Server error - please try again later');
      case 502:
      case 503:
      case 504:
        throw new NetworkError('Service temporarily unavailable');
      default:
        throw new NetworkError(message, response.status);
    }
  }

  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error = new Error('Max retries exceeded');
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry certain errors
        if (
          error instanceof ValidationError ||
          error instanceof AuthenticationError ||
          error.status === 403 ||
          error.status === 404
        ) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`🔄 Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Public API methods
  static async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  static async post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  static async put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  static async patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  static async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Cache management
  static invalidateCache(pattern?: string) {
    responseCache.invalidate(pattern);
  }

  // Enhanced user search method with better error handling
  static async searchUsers(params: {
    query: string;
    filter?: string;
    currentUserId?: string | null;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    // Only add query if it's not empty - use 'search' parameter to match backend
    if (params.query && params.query.trim()) {
      queryParams.append('search', params.query.trim());
    }
    
    // Add filter type if provided
    if (params.filter && params.filter !== 'all') {
      queryParams.append('filter', params.filter);
    }
    
    // Add current user ID if provided and valid
    if (params.currentUserId && params.currentUserId !== 'undefined' && params.currentUserId !== null) {
      queryParams.append('currentUserId', params.currentUserId);
    }
    
    const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('🔍 EnhancedApiService: Searching users with URL:', url);
    
    try {
      const response = await EnhancedApiService.get(url);
      console.log('🔍 EnhancedApiService: Search response status:', (response as any)?.success, 'data length:', Array.isArray((response as any)?.data) ? (response as any).data.length : 'not array');
      
      // Normalize response structure - handle different response formats
      if (response && typeof response === 'object') {
        // Check for success and data structure
        if ('success' in response && 'data' in response && (response as any).success && Array.isArray((response as any).data)) {
          return {
            success: true,
            data: (response as any).data,
            pagination: (response as any).pagination,
            meta: (response as any).meta
          };
        }
        // Handle direct array response
        else if (Array.isArray(response)) {
          return {
            success: true,
            data: response,
            pagination: null,
            meta: null
          };
        }
        // Handle cases where response has data but no success flag
        else if ('data' in response && Array.isArray((response as any).data)) {
          return {
            success: true,
            data: (response as any).data,
            pagination: (response as any).pagination || null,
            meta: (response as any).meta || null
          };
        }
      }
      
      console.warn('🔍 EnhancedApiService: Unexpected response format:', response);
      return {
        success: false,
        data: [],
        error: 'Unexpected response format'
      };
    } catch (error: any) {
      console.error('🔍 EnhancedApiService: Search error:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Search failed'
      };
    }
  }

  // Enhanced chat methods
  static async getChats(userId: string): Promise<any> {
    if (!userId || userId === 'undefined' || userId === null) {
      throw new Error('Invalid user ID for getting chats');
    }
    return EnhancedApiService.get(`/chats/user/${userId}`);
  }

  // Upload with progress
  static async uploadFile(
    endpoint: string,
    file: any,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const authHeaders = await this.getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress?.(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE_URL}${endpoint}`);
      
      // Set auth headers (excluding Content-Type for FormData)
      Object.entries(authHeaders).forEach(([key, value]) => {
        if (key !== 'Content-Type') {
          xhr.setRequestHeader(key, value);
        }
      });

      xhr.send(formData);
    });
  }
}
