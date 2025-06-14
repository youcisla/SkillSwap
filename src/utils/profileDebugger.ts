import { Platform } from 'react-native';

interface DebugInfo {
  platform: string;
  userId?: string;
  matchData?: any;
  userStore?: any;
  timestamp: number;
}

class ProfileDebugger {
  private static logs: DebugInfo[] = [];

  static log(context: string, data: any) {
    const debugInfo: DebugInfo = {
      platform: Platform.OS,
      timestamp: Date.now(),
      ...data
    };
    
    this.logs.push(debugInfo);
    console.log(`🐛 [${Platform.OS}] ${context}:`, debugInfo);
    
    // Keep only last 50 logs to prevent memory issues
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
  }

  static logMatchClick(matchId: string, userId: string, userData: any) {
    this.log('MATCH_CLICK', {
      matchId,
      userId,
      userExists: !!userData,
      userName: userData?.name,
      userType: typeof userData,
      userKeys: userData ? Object.keys(userData) : []
    });
  }

  static logProfileNavigation(userId: string, params: any) {
    this.log('PROFILE_NAVIGATION', {
      userId,
      params,
      paramsType: typeof params,
      hasUserId: !!params?.userId
    });
  }

  static logUserFetch(userId: string, success: boolean, error?: string) {
    this.log('USER_FETCH', {
      userId,
      success,
      error,
      fetchTime: Date.now()
    });
  }

  static logUserStore(users: any[], currentUser: any) {
    this.log('USER_STORE_STATE', {
      usersCount: users.length,
      userIds: users.map(u => u.id),
      currentUserId: currentUser?.id,
      currentUserName: currentUser?.name
    });
  }

  static getRecentLogs(count: number = 10): DebugInfo[] {
    return this.logs.slice(-count);
  }

  static clearLogs() {
    this.logs = [];
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export default ProfileDebugger;
