import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface OfflineAction {
  id: string;
  action: string;
  payload: any;
  timestamp: number;
}

export const useOfflineSync = (context?: string) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Basic network monitoring - can be enhanced with NetInfo library
    const checkConnection = () => {
      // For now, assume we're online
      // In production, use @react-native-community/netinfo
      setIsOnline(true);
    };

    checkConnection();

    // Load pending actions on app start
    loadPendingActions();
  }, []);

  const loadPendingActions = async () => {
    try {
      const stored = await AsyncStorage.getItem('offlineActions');
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load offline actions:', error);
    }
  };

  const savePendingActions = async (actions: OfflineAction[]) => {
    try {
      await AsyncStorage.setItem('offlineActions', JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to save offline actions:', error);
    }
  };

  const addOfflineAction = async (action: string, payload: any) => {
    const offlineAction: OfflineAction = {
      id: Date.now().toString(),
      action,
      payload,
      timestamp: Date.now(),
    };

    const newActions = [...pendingActions, offlineAction];
    setPendingActions(newActions);
    await savePendingActions(newActions);
  };

  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;

    const actionsToSync = [...pendingActions];
    const syncedActions: string[] = [];

    for (const action of actionsToSync) {
      try {
        // Execute the action
        await executeOfflineAction(action);
        syncedActions.push(action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        // Keep failed actions for retry
        break;
      }
    }

    // Remove successfully synced actions
    if (syncedActions.length > 0) {
      const remainingActions = pendingActions.filter(
        action => !syncedActions.includes(action.id)
      );
      setPendingActions(remainingActions);
      await savePendingActions(remainingActions);
    }
  };

  const executeOfflineAction = async (action: OfflineAction) => {
    // This would be implemented based on your specific actions
    // For example:
    switch (action.action) {
      case 'sendMessage':
        // await messageService.sendMessage(action.payload);
        break;
      case 'updateProfile':
        // await userService.updateProfile(action.payload);
        break;
      case 'createSession':
        // await sessionService.createSession(action.payload);
        break;
      default:
        console.warn('Unknown offline action:', action.action);
    }
  };

  const clearPendingActions = async () => {
    setPendingActions([]);
    await AsyncStorage.removeItem('offlineActions');
  };

  // Sync data function for refreshing
  const syncData = async () => {
    try {
      setLastSyncTime(new Date());
      // In a real implementation, this would sync with the server
      console.log(`Syncing data for context: ${context || 'default'}`);
      return Promise.resolve();
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  };

  return {
    isOnline,
    pendingActions,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
    syncData,
    lastSyncTime,
  };
};

// Offline storage utility
export class OfflineStorage {
  private static prefix = 'offline_';

  static async store(key: string, data: any): Promise<void> {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('Offline storage error:', error);
    }
  }

  static async retrieve<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(this.prefix + key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Offline retrieval error:', error);
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Offline removal error:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(offlineKeys);
    } catch (error) {
      console.error('Offline clear error:', error);
    }
  }

  static async getStorageInfo(): Promise<{
    keys: string[];
    totalSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith(this.prefix));
      
      // Estimate size (rough calculation)
      let totalSize = 0;
      for (const key of offlineKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }

      return {
        keys: offlineKeys.map(key => key.replace(this.prefix, '')),
        totalSize,
      };
    } catch (error) {
      console.error('Storage info error:', error);
      return { keys: [], totalSize: 0 };
    }
  }
}
