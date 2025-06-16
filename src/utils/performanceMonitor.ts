// Enhanced Performance Monitoring Utility
import React from 'react';
import { AppState, Platform } from 'react-native';
import { analyticsService } from '../services/analyticsService';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  context?: Record<string, any>;
  timestamp: number;
}

interface RenderMetric {
  componentName: string;
  renderTime: number;
  reRenderCount: number;
  propsCount: number;
  stateCount: number;
}

interface MemoryMetric {
  used: number;
  available: number;
  total: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private renderMetrics: Map<string, RenderMetric> = new Map();
  private isEnabled: boolean = true;
  private batchSize: number = 50;
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Start periodic monitoring
    this.startPeriodicMonitoring();
    
    // Monitor app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
    
    // Setup automatic flushing
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  private startPeriodicMonitoring() {
    // Monitor every 5 seconds when app is active
    setInterval(() => {
      if (AppState.currentState === 'active' && this.isEnabled) {
        this.collectSystemMetrics();
      }
    }, 5000);
  }

  private handleAppStateChange = (nextAppState: string) => {
    this.trackMetric('app_state_change', Date.now(), 'timestamp', {
      state: nextAppState,
      previous_state: AppState.currentState
    });
  };

  // Component Performance Monitoring
  measureComponentRender<T extends React.ComponentType<any>>(
    WrappedComponent: T,
    componentName?: string
  ): T {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';

    return React.forwardRef((props: any, ref: any) => {
      const [renderCount, setRenderCount] = React.useState(0);
      const renderStartTime = React.useRef(0);

      React.useEffect(() => {
        renderStartTime.current = performance.now();
        setRenderCount(prev => prev + 1);
      });

      React.useLayoutEffect(() => {
        const renderTime = performance.now() - renderStartTime.current;
        
        this.trackRenderMetric({
          componentName: name,
          renderTime,
          reRenderCount: renderCount,
          propsCount: Object.keys(props).length,
          stateCount: 0 // Would need state hook to track this
        });
      });

      return React.createElement(WrappedComponent, { ...props, ref });
    }) as unknown as T;
  }

  // Screen Transition Performance
  measureScreenTransition(fromScreen: string, toScreen: string) {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.trackMetric('screen_transition', duration, 'ms', {
        from: fromScreen,
        to: toScreen
      });

      analyticsService.trackNavigationTiming(fromScreen, toScreen, duration);
    };
  }

  // API Call Performance
  measureApiCall(endpoint: string, method: string) {
    const startTime = performance.now();

    return (statusCode: number, success: boolean) => {
      const duration = performance.now() - startTime;
      this.trackMetric('api_call', duration, 'ms', {
        endpoint,
        method,
        status_code: statusCode,
        success
      });

      analyticsService.trackApiCall(endpoint, method, duration, statusCode, success);
    };
  }

  // Animation Performance
  measureAnimation(animationName: string) {
    const startTime = performance.now();
    let frameCount = 0;
    let animationId: number;

    const measureFrame = () => {
      frameCount++;
      animationId = requestAnimationFrame(measureFrame);
    };

    measureFrame();

    return () => {
      cancelAnimationFrame(animationId);
      const duration = performance.now() - startTime;
      const fps = frameCount / (duration / 1000);

      this.trackMetric('animation_performance', fps, 'fps', {
        animation_name: animationName,
        duration,
        frame_count: frameCount
      });
    };
  }

  // Memory Usage Monitoring
  private async collectSystemMetrics() {
    try {
      // Memory usage
      const memoryInfo = await this.getMemoryInfo();
      if (memoryInfo) {
        this.trackMetric('memory_usage', memoryInfo.used, 'MB', {
          total: memoryInfo.total,
          available: memoryInfo.available,
          percentage: (memoryInfo.used / memoryInfo.total) * 100
        });
      }

      // Device info
      const deviceInfo = await this.getDeviceInfo();
      if (deviceInfo) {
        this.trackMetric('device_performance', 1, 'status', deviceInfo);
      }

    } catch (error) {
      console.warn('Failed to collect system metrics:', error);
    }
  }

  private async getMemoryInfo(): Promise<MemoryMetric | null> {
    try {
      // This would require a native module for accurate memory info
      // For now, we'll use approximate values
      const usedMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const totalMemory = (performance as any).memory?.totalJSHeapSize || 0;

      return {
        used: Math.round(usedMemory / (1024 * 1024)), // Convert to MB
        total: Math.round(totalMemory / (1024 * 1024)),
        available: Math.round((totalMemory - usedMemory) / (1024 * 1024)),
        timestamp: Date.now()
      };
    } catch (error) {
      return null;
    }
  }

  private async getDeviceInfo() {
    try {
      return {
        device_model: 'Unknown',
        system_version: Platform.OS + ' ' + Platform.Version,
        app_version: '1.0.0',
        battery_level: 1.0,
        is_low_power_mode: false,
        available_storage: 1000000000 // 1GB placeholder
      };
    } catch (error) {
      return null;
    }
  }

  // List Performance Monitoring
  measureListPerformance(listName: string, itemCount: number) {
    const startTime = performance.now();
    let scrollEvents = 0;

    const onScroll = () => {
      scrollEvents++;
    };

    const onEndReached = () => {
      const duration = performance.now() - startTime;
      this.trackMetric('list_performance', duration, 'ms', {
        list_name: listName,
        item_count: itemCount,
        scroll_events: scrollEvents
      });
    };

    return { onScroll, onEndReached };
  }

  // Image Loading Performance
  measureImageLoad(imageUrl: string, imageSize?: { width: number; height: number }) {
    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;
      this.trackMetric('image_load', loadTime, 'ms', {
        url: imageUrl,
        size: imageSize,
        is_cached: loadTime < 50 // Assume cached if very fast
      });
    };
  }

  // Bundle Size and Load Time
  measureBundleLoad(bundleName: string) {
    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;
      this.trackMetric('bundle_load', loadTime, 'ms', {
        bundle_name: bundleName
      });
    };
  }

  // Private Methods
  private trackMetric(name: string, value: number, unit: string, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      context,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Also send to analytics service
    analyticsService.trackPerformance(name, value, unit, context);

    // Flush if batch size reached
    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }
  }

  private trackRenderMetric(metric: RenderMetric) {
    if (!this.isEnabled) return;

    this.renderMetrics.set(metric.componentName, metric);
    
    this.trackMetric('component_render', metric.renderTime, 'ms', {
      component: metric.componentName,
      re_render_count: metric.reRenderCount,
      props_count: metric.propsCount
    });
  }

  // Performance Alerts
  private checkPerformanceThresholds(metric: PerformanceMetric) {
    const thresholds = {
      screen_transition: 300, // 300ms
      api_call: 5000, // 5 seconds
      component_render: 50, // 50ms
      image_load: 3000, // 3 seconds
      list_scroll: 16.67 // 60fps = 16.67ms per frame
    };

    const threshold = thresholds[metric.name];
    if (threshold && metric.value > threshold) {
      analyticsService.trackEvent('performance_alert', {
        metric_name: metric.name,
        actual_value: metric.value,
        threshold,
        context: metric.context
      });
    }
  }

  // Public API
  flush() {
    if (this.metrics.length === 0) return;

    // Check for performance issues
    this.metrics.forEach(metric => {
      this.checkPerformanceThresholds(metric);
    });

    // Send to analytics
    analyticsService.trackEvent('performance_batch', {
      metrics_count: this.metrics.length,
      timestamp: Date.now()
    });

    // Clear metrics
    this.metrics = [];
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getRenderMetrics(): RenderMetric[] {
    return Array.from(this.renderMetrics.values());
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.metrics = [];
      this.renderMetrics.clear();
    }
  }

  destroy() {
    this.setEnabled(false);
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // AppState event cleanup is handled automatically in React Native
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// HOC for component performance monitoring
export const withPerformanceMonitoring = <T extends React.ComponentType<any>>(
  WrappedComponent: T,
  componentName?: string
): any => {
  return performanceMonitor.measureComponentRender(WrappedComponent, componentName);
};

// Hook for measuring operations
export const usePerformanceMonitoring = () => {
  return {
    measureScreenTransition: performanceMonitor.measureScreenTransition.bind(performanceMonitor),
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    measureAnimation: performanceMonitor.measureAnimation.bind(performanceMonitor),
    measureImageLoad: performanceMonitor.measureImageLoad.bind(performanceMonitor),
    measureListPerformance: performanceMonitor.measureListPerformance.bind(performanceMonitor)
  };
};

export default performanceMonitor;
