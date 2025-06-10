import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const NetworkDebugger = {
  getDeviceInfo() {
    return {
      platform: Platform.OS,
      isDevice: Constants.isDevice,
      deviceType: Constants.isDevice ? 'Physical Device' : 'Simulator/Emulator',
      expoVersion: Constants.expoVersion,
      appVersion: Constants.manifest?.version || 'unknown',
    };
  },

  getCurrentApiUrl() {
    const DEVELOPMENT_IP = '192.168.1.93';
    
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
    }
    
    return `http://${DEVELOPMENT_IP}:3000/api`;
  },

  async testConnection() {
    const apiUrl = this.getCurrentApiUrl();
    const deviceInfo = this.getDeviceInfo();
    
    console.log('🔍 Network Debug Info:', {
      deviceInfo,
      apiUrl,
      timestamp: new Date().toISOString(),
    });

    try {
      console.log(`🌐 Testing connection to: ${apiUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Connection successful!');
        const data = await response.json();
        return { success: true, data, status: response.status };
      } else {
        console.log(`❌ Connection failed with status: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}`, status: response.status };
      }
    } catch (error: any) {
      console.log('❌ Connection error:', error.message);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Connection timeout' };
      }
      
      return { success: false, error: error.message };
    }
  },

  logNetworkConfig() {
    const info = this.getDeviceInfo();
    const apiUrl = this.getCurrentApiUrl();
    
    console.log('📱 Device Configuration:');
    console.log(`  Platform: ${info.platform}`);
    console.log(`  Device Type: ${info.deviceType}`);
    console.log(`  Is Physical Device: ${info.isDevice}`);
    console.log(`  API URL: ${apiUrl}`);
    console.log('');
    
    if (info.platform === 'ios' && !info.isDevice) {
      console.log('💡 iOS Simulator detected - using localhost');
    } else if (info.platform === 'ios' && info.isDevice) {
      console.log('📱 iOS Physical Device detected - using IP address');
    } else if (info.platform === 'android' && !info.isDevice) {
      console.log('🤖 Android Emulator detected - using 10.0.2.2');
    } else if (info.platform === 'android' && info.isDevice) {
      console.log('📱 Android Physical Device detected - using IP address');
    } else if (info.platform === 'web') {
      console.log('🌐 Web platform detected - using localhost');
    }
  }
};
