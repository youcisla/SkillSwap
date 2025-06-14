// Enhanced Analytics and Performance Monitoring Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
  platform: string;
  appVersion: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: Record<string, any>;
}

interface ErrorReport {
  error: Error;
  context?: Record<string, any>;
  userId?: string;
  timestamp: number;
  platform: string;
  appVersion: string;
  stackTrace?: string;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  pageViews: string[];
  actions: string[];
  errors: number;
  crashes: number;
}

class EnhancedAnalyticsService {
  private sessionId: string;
  private userId?: string;
  private currentSession: UserSession;
  private isEnabled: boolean;
  private queue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private errorQueue: ErrorReport[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly QUEUE_LIMIT = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly STORAGE_KEY = 'analytics_queue';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = __DEV__ ? false : true; // Disable in development
    this.currentSession = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      pageViews: [],
      actions: [],
      errors: 0,
      crashes: 0
    };

    this.initializeService();
  }

  private async initializeService() {
    try {
      // Load queued events from storage
      await this.loadQueueFromStorage();
      
      // Start flush interval
      this.startFlushInterval();
      
      // Track app start
      this.trackEvent('app_start', {
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: Date.now()
      });

      // Setup crash detection
      this.setupCrashDetection();
      
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadQueueFromStorage() {
    try {
      const storedQueue = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Failed to load analytics queue from storage:', error);
    }
  }

  private async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save analytics queue to storage:', error);
    }
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private setupCrashDetection() {
    // Setup error boundary integration
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.trackError(error, { isFatal });
      if (isFatal) {
        this.currentSession.crashes++;
        this.flush(); // Immediately flush on crash
      }
      originalHandler(error, isFatal);
    });
  }

  // Public Methods

  setUserId(userId: string) {
    this.userId = userId;
    this.currentSession.userId = userId;
    this.trackEvent('user_identified', { userId });
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearQueue();
    }
  }

  // Event Tracking
  trackEvent(name: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      platform: Platform.OS,
      appVersion: '1.0.0' // Should come from app config
    };

    this.queue.push(event);
    this.currentSession.actions.push(name);

    if (this.queue.length >= this.QUEUE_LIMIT) {
      this.flush();
    }
  }

  // Screen/Page Tracking
  trackScreenView(screenName: string, properties?: Record<string, any>) {
    this.currentSession.pageViews.push(screenName);
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties
    });
  }

  // User Actions
  trackUserAction(action: string, target?: string, properties?: Record<string, any>) {
    this.trackEvent('user_action', {
      action,
      target,
      ...properties
    });
  }

  // E-commerce/Conversion Events
  trackConversion(event: string, value?: number, currency?: string, properties?: Record<string, any>) {
    this.trackEvent('conversion', {
      event,
      value,
      currency,
      ...properties
    });
  }

  // Performance Monitoring
  trackPerformance(name: string, value: number, unit: string = 'ms', context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context
    };

    this.performanceQueue.push(metric);
  }

  // API Performance Tracking
  trackApiCall(endpoint: string, method: string, duration: number, statusCode: number, success: boolean) {
    this.trackPerformance('api_call_duration', duration, 'ms', {
      endpoint,
      method,
      status_code: statusCode,
      success
    });

    this.trackEvent('api_call', {
      endpoint,
      method,
      duration,
      status_code: statusCode,
      success
    });
  }

  // Navigation Performance
  trackNavigationTiming(fromScreen: string, toScreen: string, duration: number) {
    this.trackPerformance('navigation_duration', duration, 'ms', {
      from_screen: fromScreen,
      to_screen: toScreen
    });
  }

  // Memory Usage
  trackMemoryUsage() {
    if (__DEV__) {
      // In development, we can use performance monitoring tools
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        this.trackPerformance('memory_used', memoryInfo.usedJSHeapSize, 'bytes');
        this.trackPerformance('memory_total', memoryInfo.totalJSHeapSize, 'bytes');
      }
    }
  }

  // Error Tracking
  trackError(error: Error, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      error,
      context,
      userId: this.userId,
      timestamp: Date.now(),
      platform: Platform.OS,
      appVersion: '1.0.0',
      stackTrace: error.stack
    };

    this.errorQueue.push(errorReport);
    this.currentSession.errors++;

    // Also track as event
    this.trackEvent('error', {
      error_message: error.message,
      error_name: error.name,
      ...context
    });
  }

  // Enhanced Error Logging for Error Boundaries
  logError(errorDetails: {
    name: string;
    message: string;
    stack?: string;
    level?: string;
    context?: string;
    componentStack?: string;
    errorBoundary?: boolean;
    timestamp?: string;
    errorId?: string;
  }) {
    if (!this.isEnabled) return;

    const error = new Error(errorDetails.message);
    error.name = errorDetails.name;
    error.stack = errorDetails.stack;

    this.trackError(error, {
      level: errorDetails.level,
      context: errorDetails.context,
      component_stack: errorDetails.componentStack,
      error_boundary: errorDetails.errorBoundary,
      error_id: errorDetails.errorId,
      timestamp: errorDetails.timestamp
    });
  }

  // Custom Metrics
  trackCustomMetric(name: string, value: number, tags?: Record<string, string>) {
    this.trackEvent('custom_metric', {
      metric_name: name,
      metric_value: value,
      tags
    });
  }

  // A/B Testing Support
  trackExperiment(experimentName: string, variant: string, properties?: Record<string, any>) {
    this.trackEvent('experiment_viewed', {
      experiment_name: experimentName,
      variant,
      ...properties
    });
  }

  // User Engagement
  trackEngagement(type: 'session_start' | 'session_end' | 'app_background' | 'app_foreground', duration?: number) {
    this.trackEvent('engagement', {
      type,
      duration,
      session_duration: Date.now() - this.currentSession.startTime
    });
  }

  // Feature Usage
  trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>) {
    this.trackEvent('feature_usage', {
      feature,
      action,
      ...properties
    });
  }

  // Business Metrics
  trackBusinessMetric(metric: string, value: number, properties?: Record<string, any>) {
    this.trackEvent('business_metric', {
      metric,
      value,
      ...properties
    });
  }

  // Data Flushing
  async flush() {
    if (!this.isEnabled || this.queue.length === 0) return;

    try {
      // Send events to analytics service
      await this.sendEvents();
      
      // Send performance metrics
      await this.sendPerformanceMetrics();
      
      // Send error reports
      await this.sendErrorReports();
      
      // Clear queues after successful send
      this.clearQueue();
      
    } catch (error) {
      console.error('Failed to flush analytics data:', error);
      // Keep data in queue for retry
      await this.saveQueueToStorage();
    }
  }

  private async sendEvents() {
    if (this.queue.length === 0) return;

    // In a real implementation, send to your analytics service
    // Examples: Firebase Analytics, Mixpanel, Amplitude, etc.
    
    console.log('📊 Sending analytics events:', this.queue.length);
    
    // Example implementation for a custom analytics API
    /*
    const response = await fetch('https://your-analytics-api.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        events: this.queue,
        session: this.currentSession
      })
    });
    
    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
    */
  }

  private async sendPerformanceMetrics() {
    if (this.performanceQueue.length === 0) return;

    console.log('📈 Sending performance metrics:', this.performanceQueue.length);
    
    // Send to performance monitoring service
    // Examples: DataDog, New Relic, AppDynamics, etc.
  }

  private async sendErrorReports() {
    if (this.errorQueue.length === 0) return;

    console.log('🐛 Sending error reports:', this.errorQueue.length);
    
    // Send to error tracking service
    // Examples: Sentry, Bugsnag, Rollbar, etc.
  }

  private clearQueue() {
    this.queue = [];
    this.performanceQueue = [];
    this.errorQueue = [];
  }

  // Session Management
  startSession() {
    this.currentSession = {
      sessionId: this.generateSessionId(),
      userId: this.userId,
      startTime: Date.now(),
      pageViews: [],
      actions: [],
      errors: 0,
      crashes: 0
    };
    
    this.trackEngagement('session_start');
  }

  endSession() {
    this.currentSession.endTime = Date.now();
    const duration = this.currentSession.endTime - this.currentSession.startTime;
    
    this.trackEngagement('session_end', duration);
    
    // Send session summary
    this.trackEvent('session_summary', {
      duration,
      page_views: this.currentSession.pageViews.length,
      actions: this.currentSession.actions.length,
      errors: this.currentSession.errors,
      crashes: this.currentSession.crashes
    });
    
    this.flush();
  }

  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.endSession();
  }

  // Utility Methods
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.currentSession.startTime,
      duration: Date.now() - this.currentSession.startTime
    };
  }

  getQueueSize() {
    return {
      events: this.queue.length,
      performance: this.performanceQueue.length,
      errors: this.errorQueue.length
    };
  }
}

// Performance Timing Utility
export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  end(properties?: Record<string, any>) {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    
    analyticsService.trackPerformance(this.name, duration, 'ms', properties);
    return duration;
  }
}

// HOC for tracking screen views
export function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName: string
) {
  return function AnalyticsWrapper(props: P) {
    React.useEffect(() => {
      analyticsService.trackScreenView(screenName);
    }, []);

    return React.createElement(WrappedComponent, props);
  };
}

// Hook for tracking user actions
export function useAnalytics() {
  return {
    trackEvent: analyticsService.trackEvent.bind(analyticsService),
    trackAction: analyticsService.trackUserAction.bind(analyticsService),
    trackFeature: analyticsService.trackFeatureUsage.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    trackPerformance: analyticsService.trackPerformance.bind(analyticsService),
    startTimer: (name: string) => new PerformanceTimer(name),
  };
}

// Singleton instance
export const analyticsService = new EnhancedAnalyticsService();

export default analyticsService;
