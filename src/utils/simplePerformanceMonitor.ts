// Simplified Performance Monitoring Utility
import React from 'react';
import { AppState, InteractionManager } from 'react-native';
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
}

class SimplePerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private renderMetrics: Map<string, RenderMetric> = new Map();
  private isEnabled: boolean = true;
  private batchSize: number = 50;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Start periodic monitoring
    this.startPeriodicMonitoring();
    
    // Monitor app state changes
    const subscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Setup automatic flushing
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  private startPeriodicMonitoring() {
    // Monitor every 10 seconds when app is active
    setInterval(() => {
      if (AppState.currentState === 'active' && this.isEnabled) {
        this.collectBasicMetrics();
      }
    }, 10000);
  }

  private handleAppStateChange = (nextAppState: string) => {
    this.trackMetric('app_state_change', Date.now(), 'timestamp', {
      state: nextAppState
    });
  };

  // Component Performance Monitoring with React 18+ compatible approach
  measureComponentRender<T extends React.ComponentType<any>>(
    WrappedComponent: T,
    componentName?: string
  ): React.ComponentType<React.ComponentProps<T>> {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';

    return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
      const [renderCount, setRenderCount] = React.useState(0);
      const renderStartTime = React.useRef(0);

      React.useEffect(() => {
        renderStartTime.current = Date.now();
        setRenderCount(prev => prev + 1);
      });

      React.useLayoutEffect(() => {
        const renderTime = Date.now() - renderStartTime.current;
        
        this.trackRenderMetric({
          componentName: name,
          renderTime,
          reRenderCount: renderCount,
          propsCount: Object.keys(props).length
        });
      });

      return React.createElement(WrappedComponent, { ...props, ref });
    });
  }

  // Screen Transition Performance
  measureScreenTransition(fromScreen: string, toScreen: string) {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.trackMetric('screen_transition', duration, 'ms', {
        from: fromScreen,
        to: toScreen
      });

      analyticsService.trackNavigationTiming(fromScreen, toScreen, duration);
    };
  }

  // API Call Performance
  measureApiCall(endpoint: string, method: string) {
    const startTime = Date.now();

    return (statusCode: number, success: boolean) => {
      const duration = Date.now() - startTime;
      this.trackMetric('api_call', duration, 'ms', {
        endpoint,
        method,
        status_code: statusCode,
        success
      });

      analyticsService.trackApiCall(endpoint, method, duration, statusCode, success);
    };
  }

  // Animation Performance (simplified)
  measureAnimation(animationName: string) {
    const startTime = Date.now();
    let frameCount = 0;
    let animationId: number;

    const measureFrame = () => {
      frameCount++;
      animationId = requestAnimationFrame(measureFrame);
    };

    measureFrame();

    return () => {
      cancelAnimationFrame(animationId);
      const duration = Date.now() - startTime;
      const fps = frameCount / (duration / 1000);

      this.trackMetric('animation_performance', fps, 'fps', {
        animation_name: animationName,
        duration,
        frame_count: frameCount
      });
    };
  }

  // Basic System Metrics
  private collectBasicMetrics() {
    try {
      // JavaScript heap memory (if available)
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        this.trackMetric('js_heap_used', 
          Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024)), 
          'MB'
        );
        
        this.trackMetric('js_heap_total', 
          Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024)), 
          'MB'
        );
      }

      // Basic timing metrics
      this.trackMetric('timestamp', Date.now(), 'ms');

    } catch (error) {
      console.warn('Failed to collect basic metrics:', error);
    }
  }

  // List Performance Monitoring
  measureListPerformance(listName: string, itemCount: number) {
    const startTime = Date.now();
    let scrollEvents = 0;

    const onScroll = () => {
      scrollEvents++;
    };

    const onEndReached = () => {
      const duration = Date.now() - startTime;
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
    const startTime = Date.now();

    return () => {
      const loadTime = Date.now() - startTime;
      this.trackMetric('image_load', loadTime, 'ms', {
        url: imageUrl,
        size: imageSize,
        is_cached: loadTime < 50 // Assume cached if very fast
      });
    };
  }

  // Bundle Size and Load Time
  measureBundleLoad(bundleName: string) {
    const startTime = Date.now();

    return () => {
      const loadTime = Date.now() - startTime;
      this.trackMetric('bundle_load', loadTime, 'ms', {
        bundle_name: bundleName
      });
    };
  }

  // Interaction Performance
  measureInteraction(interactionName: string) {
    const startTime = Date.now();

    return InteractionManager.runAfterInteractions(() => {
      const duration = Date.now() - startTime;
      this.trackMetric('interaction_delay', duration, 'ms', {
        interaction_name: interactionName
      });
    });
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
    const thresholds: Record<string, number> = {
      screen_transition: 300, // 300ms
      api_call: 5000, // 5 seconds
      component_render: 50, // 50ms
      image_load: 3000, // 3 seconds
      interaction_delay: 100 // 100ms
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

  // Get performance summary
  getPerformanceSummary() {
    const summary = {
      total_metrics: this.metrics.length,
      render_metrics: this.renderMetrics.size,
      avg_render_time: 0,
      slow_renders: 0,
      timestamp: Date.now()
    };

    if (this.renderMetrics.size > 0) {
      const renderTimes = Array.from(this.renderMetrics.values()).map(m => m.renderTime);
      summary.avg_render_time = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      summary.slow_renders = renderTimes.filter(t => t > 50).length;
    }

    return summary;
  }

  destroy() {
    this.setEnabled(false);
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

// Create singleton instance
export const performanceMonitor = new SimplePerformanceMonitor();

// HOC for component performance monitoring
export const withPerformanceMonitoring = <T extends React.ComponentType<any>>(
  WrappedComponent: T,
  componentName?: string
): React.ComponentType<React.ComponentProps<T>> => {
  return performanceMonitor.measureComponentRender(WrappedComponent, componentName);
};

// Hook for measuring operations
export const usePerformanceMonitoring = () => {
  return {
    measureScreenTransition: performanceMonitor.measureScreenTransition.bind(performanceMonitor),
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    measureAnimation: performanceMonitor.measureAnimation.bind(performanceMonitor),
    measureImageLoad: performanceMonitor.measureImageLoad.bind(performanceMonitor),
    measureListPerformance: performanceMonitor.measureListPerformance.bind(performanceMonitor),
    measureInteraction: performanceMonitor.measureInteraction.bind(performanceMonitor),
    getPerformanceSummary: performanceMonitor.getPerformanceSummary.bind(performanceMonitor)
  };
};

export default performanceMonitor;
