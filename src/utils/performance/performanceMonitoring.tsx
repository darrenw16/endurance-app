/**
 * Performance monitoring utilities for the endurance racing app
 */
import React from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  componentRenderTime: number;
  timerUpdateLatency: number;
  stintCalculationTime: number;
  memoryUsage?: number;
  timestamp: number;
}

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 16, // 60fps target
  TIMER_UPDATE: 50,     // Timer update should be fast
  STINT_CALCULATION: 100, // Stint calculations
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
} as const;

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    if (this.isEnabled && typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    try {
      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Only log tasks over 100ms to reduce noise
            console.warn(`🐌 Long task detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Monitor measures (custom performance marks)
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('race-')) {
            this.recordMetric(entry.name, entry.duration);
          }
        }
      });

      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);

    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  // Record a custom performance metric
  recordMetric(name: string, duration: number) {
    const metric: Partial<PerformanceMetrics> = {
      timestamp: Date.now()
    };

    if (name.includes('render')) {
      metric.componentRenderTime = duration;
    } else if (name.includes('timer')) {
      metric.timerUpdateLatency = duration;
    } else if (name.includes('stint')) {
      metric.stintCalculationTime = duration;
    }

    this.metrics.push(metric as PerformanceMetrics);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Warn if performance is poor
    if (duration > this.getThresholdForMetric(name)) {
      console.warn(`⚠️ Performance warning: ${name} took ${duration.toFixed(2)}ms (threshold: ${this.getThresholdForMetric(name)}ms)`);
    }
  }

  private getThresholdForMetric(name: string): number {
    if (name.includes('render')) return PERFORMANCE_THRESHOLDS.COMPONENT_RENDER;
    if (name.includes('timer')) return PERFORMANCE_THRESHOLDS.TIMER_UPDATE;
    if (name.includes('stint')) return PERFORMANCE_THRESHOLDS.STINT_CALCULATION;
    return 100; // Default threshold
  }

  // Start timing a performance-critical operation
  startTiming(label: string): () => void {
    if (!this.isEnabled) return () => {};
    
    const startMark = `${label}-start`;
    const endMark = `${label}-end`;
    const measureName = `race-${label}`;

    performance.mark(startMark);

    return () => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
    };
  }

  // Get current memory usage (if available)
  getMemoryUsage(): number | null {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return null;
  }

  // Get performance summary
  getPerformanceSummary(): {
    averageRenderTime: number;
    averageTimerLatency: number;
    averageStintCalculation: number;
    memoryUsage: number | null;
    totalMetrics: number;
  } {
    const renderTimes = this.metrics.filter(m => m.componentRenderTime).map(m => m.componentRenderTime);
    const timerLatencies = this.metrics.filter(m => m.timerUpdateLatency).map(m => m.timerUpdateLatency);
    const stintCalculations = this.metrics.filter(m => m.stintCalculationTime).map(m => m.stintCalculationTime);

    return {
      averageRenderTime: renderTimes.length ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0,
      averageTimerLatency: timerLatencies.length ? timerLatencies.reduce((a, b) => a + b, 0) / timerLatencies.length : 0,
      averageStintCalculation: stintCalculations.length ? stintCalculations.reduce((a, b) => a + b, 0) / stintCalculations.length : 0,
      memoryUsage: this.getMemoryUsage(),
      totalMetrics: this.metrics.length
    };
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
  const startTiming = (operation: string) => {
    return performanceMonitor.startTiming(`${componentName}-${operation}`);
  };

  const recordRender = () => {
    const endTiming = performanceMonitor.startTiming(`${componentName}-render`);
    
    // Return cleanup function to be called after render
    return endTiming;
  };

  return {
    startTiming,
    recordRender,
    getMemoryUsage: () => performanceMonitor.getMemoryUsage(),
    getSummary: () => performanceMonitor.getPerformanceSummary()
  };
};

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Component';
  
  const PerformanceMonitoredComponent = React.forwardRef<any, P>((props, ref) => {
    const { recordRender } = usePerformanceMonitoring(name);
    
    React.useEffect(() => {
      const endTiming = recordRender();
      return endTiming;
    });

    // Fix the TypeScript issue by properly spreading props
    return <Component {...(props as P)} ref={ref} />;
  });

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${name})`;
  
  return PerformanceMonitoredComponent;
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility for expensive calculations
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);

    // Prevent memory leaks by limiting cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}
