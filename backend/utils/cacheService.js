// Redis caching implementation for improved performance
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes
  }

  async connect() {
    try {
      // Use Redis if available, otherwise fallback to in-memory cache
      if (process.env.REDIS_URL) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL
        });
        
        await this.client.connect();
        console.log('✅ Connected to Redis cache');
      } else {
        // Fallback to in-memory cache for development
        this.client = new InMemoryCache();
        console.log('⚠️  Using in-memory cache (Redis not available)');
      }
      
      this.isConnected = true;
    } catch (error) {
      console.error('❌ Cache connection failed:', error);
      // Fallback to in-memory cache
      this.client = new InMemoryCache();
      this.isConnected = true;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (this.client.setEx) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized, ttl);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected) return false;
    
    try {
      if (this.client.keys) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        // In-memory cache pattern invalidation
        this.client.invalidatePattern(pattern);
      }
      return true;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected) return false;
    
    try {
      if (this.client.flushAll) {
        await this.client.flushAll();
      } else {
        this.client.clear();
      }
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Cache wrapper for functions
  async cached(key, fn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  // Generate cache keys
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }

  // Check if cache is connected
  getConnectionStatus() {
    return this.isConnected;
  }

  // Disconnect from cache
  async disconnect() {
    try {
      if (this.client && this.client.quit) {
        await this.client.quit();
      } else if (this.client && this.client.clear) {
        this.client.clear();
      }
      this.isConnected = false;
      console.log('✅ Cache disconnected');
    } catch (error) {
      console.error('Cache disconnect error:', error);
    }
  }
}

// In-memory cache fallback
class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.timers.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key, value, ttl = 300) {
    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiry });
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl * 1000);
    
    this.timers.set(key, timer);
    return true;
  }

  async del(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    
    return this.cache.delete(key);
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.del(key);
      }
    }
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.del(key);
      }
    }
  }
}

// Cache middleware
const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    const key = typeof keyGenerator === 'function' 
      ? keyGenerator(req) 
      : keyGenerator;
    
    const cached = await cacheService.get(key);
    if (cached) {
      console.log(`📦 Cache hit: ${key}`);
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      if (res.statusCode === 200 && data.success !== false) {
        cacheService.set(key, data, ttl).catch(console.error);
      }
      originalJson.call(this, data);
    };

    next();
  };
};

// Cache key generators
const CacheKeys = {
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:profile:${userId}`,
  userSkills: (userId) => `user:skills:${userId}`,
  userSessions: (userId) => `user:sessions:${userId}`,
  userMatches: (userId) => `user:matches:${userId}`,
  userChats: (userId) => `user:chats:${userId}`,
  chatMessages: (chatId) => `chat:messages:${chatId}`,
  skillSearch: (query) => `skills:search:${Buffer.from(query).toString('base64')}`,
  userSearch: (query) => `users:search:${Buffer.from(query).toString('base64')}`,
  nearbyUsers: (lat, lon, radius) => `users:nearby:${lat}:${lon}:${radius}`,
  adminStats: () => 'admin:stats',
  systemHealth: () => 'system:health',
};

// Cache invalidation patterns
const CachePatterns = {
  user: (userId) => `user:${userId}*`,
  allUsers: () => 'user:*',
  skills: () => 'skills:*',
  sessions: () => 'sessions:*',
  chats: () => 'chat:*',
  admin: () => 'admin:*',
};

// Initialize cache service
const cacheService = new CacheService();

module.exports = {
  cacheService,
  cacheMiddleware,
  CacheKeys,
  CachePatterns,
  InMemoryCache
};
