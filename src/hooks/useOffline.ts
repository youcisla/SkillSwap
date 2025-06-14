import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

interface OfflineData {
  [key: string]: any;
}

interface UseOfflineOptions {
  syncOnReconnect?: boolean;
  cacheTimeout?: number; // in milliseconds
}

export const useOffline = (options: UseOfflineOptions = {}) => {
  const { syncOnReconnect = true, cacheTimeout = 5 * 60 * 1000 } = options; // 5 minutes default
  
  const [isOnline, setIsOnline] = useState(true);
  const [isAppActive, setIsAppActive] = useState(true);
  const pendingSyncData = useRef<OfflineData[]>([]);

  // Simplified network check (you can enhance this with actual network monitoring)
  const checkNetworkStatus = useCallback(async () => {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    }
  }, []);

  // Monitor network connectivity periodically
  useEffect(() => {
    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkNetworkStatus]);

  // Monitor app state
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setIsAppActive(nextAppState === 'active');
      
      if (nextAppState === 'active') {
        checkNetworkStatus();
        if (isOnline && syncOnReconnect) {
          syncPendingData();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isOnline, syncOnReconnect, checkNetworkStatus]);

  const cacheData = useCallback(async (key: string, data: any) => {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, []);

  const getCachedData = useCallback(async (key: string) => {
    try {
      const cachedEntry = await AsyncStorage.getItem(`cache_${key}`);
      if (!cachedEntry) return null;

      const parsed = JSON.parse(cachedEntry);
      const isExpired = Date.now() - parsed.timestamp > cacheTimeout;
      
      if (isExpired) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }, [cacheTimeout]);

  const addToSyncQueue = useCallback(async (action: string, data: any) => {
    const syncItem = {
      action,
      data,
      timestamp: Date.now(),
      id: `${action}_${Date.now()}_${Math.random()}`,
    };

    pendingSyncData.current.push(syncItem);
    
    // Persist sync queue
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(pendingSyncData.current));
    } catch (error) {
      console.warn('Failed to persist sync queue:', error);
    }
  }, []);

  const syncPendingData = useCallback(async () => {
    if (!isOnline || pendingSyncData.current.length === 0) return;

    try {
      // Load persisted sync queue
      const persistedQueue = await AsyncStorage.getItem('sync_queue');
      if (persistedQueue) {
        const queue = JSON.parse(persistedQueue);
        pendingSyncData.current = [...pendingSyncData.current, ...queue];
      }

      const syncPromises = pendingSyncData.current.map(async (item) => {
        try {
          // Implement your sync logic here based on action type
          console.log('Syncing offline action:', item.action);
          
          // Example sync implementation
          // await apiService.syncOfflineAction(item);
          
          return { success: true, id: item.id };
        } catch (error) {
          console.warn('Failed to sync item:', item.id, error);
          return { success: false, id: item.id, error };
        }
      });

      const results = await Promise.allSettled(syncPromises);
      
      // Remove successfully synced items
      const successfulIds = results
        .filter((result) => result.status === 'fulfilled' && result.value.success)
        .map((result) => (result as any).value.id);

      pendingSyncData.current = pendingSyncData.current.filter(
        (item) => !successfulIds.includes(item.id)
      );

      // Update persisted queue
      await AsyncStorage.setItem('sync_queue', JSON.stringify(pendingSyncData.current));
      
      console.log(`Synced ${successfulIds.length} offline actions`);
    } catch (error) {
      console.error('Failed to sync pending data:', error);
    }
  }, [isOnline]);

  const clearCache = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, []);

  return {
    isOnline,
    isAppActive,
    cacheData,
    getCachedData,
    addToSyncQueue,
    syncPendingData,
    clearCache,
    pendingSync: pendingSyncData.current.length,
  };
};

export default useOffline;
