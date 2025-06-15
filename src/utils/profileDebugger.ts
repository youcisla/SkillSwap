/**
 * ProfileDebugger - Utility for debugging profile-related operations
 * This utility provides logging methods for tracking user navigation,
 * profile fetching, match interactions, and user store state.
 */

interface User {
  id: string;
  name: string;
  [key: string]: any;
}

interface RouteParams {
  userId?: string;
  [key: string]: any;
}

class ProfileDebugger {
  private static isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

  /**
   * Log profile navigation events
   */
  static logProfileNavigation(userId: string, routeParams?: RouteParams): void {
    if (!this.isDev) return;
    
    console.log('🔍 ProfileDebugger: Navigation Event', {
      userId,
      routeParams,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log user fetch operations
   */
  static logUserFetch(userId: string, success: boolean, errorMessage?: string): void {
    if (!this.isDev) return;
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ProfileDebugger: User Fetch`, {
      userId,
      success,
      errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log match click events
   */
  static logMatchClick(matchId: string, userId: string, matchedUser: User): void {
    if (!this.isDev) return;
    
    console.log('👆 ProfileDebugger: Match Click', {
      matchId,
      userId,
      matchedUser: {
        id: matchedUser.id,
        name: matchedUser.name,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log user store state for debugging
   */
  static logUserStore(users: User[], currentUser?: User | null): void {
    if (!this.isDev) return;
    
    console.log('📦 ProfileDebugger: User Store State', {
      totalUsers: users.length,
      currentUser: currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
      } : null,
      userIds: users.map(u => u.id),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log general profile-related events
   */
  static log(event: string, data?: any): void {
    if (!this.isDev) return;
    
    console.log(`🔧 ProfileDebugger: ${event}`, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log errors with context
   */
  static logError(context: string, error: any, additionalData?: any): void {
    if (!this.isDev) return;
    
    console.error(`🚨 ProfileDebugger Error: ${context}`, {
      error: error?.message || error,
      stack: error?.stack,
      additionalData,
      timestamp: new Date().toISOString(),
    });
  }
}

export default ProfileDebugger;
