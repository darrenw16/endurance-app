// Mock for performance monitoring module
module.exports = {
  performanceMonitor: {
    startTiming: jest.fn(() => jest.fn()),
    recordMetric: jest.fn(),
    getPerformanceSummary: jest.fn(() => ({
      averageRenderTime: 0,
      averageTimerLatency: 0,
      averageStintCalculation: 0,
      memoryUsage: null,
      totalMetrics: 0
    })),
    setEnabled: jest.fn(),
    cleanup: jest.fn(),
    getMemoryUsage: jest.fn(() => null)
  },
  usePerformanceMonitoring: jest.fn(() => ({
    startTiming: jest.fn(() => jest.fn()),
    recordRender: jest.fn(() => jest.fn()),
    getMemoryUsage: jest.fn(() => null),
    getSummary: jest.fn(() => ({
      averageRenderTime: 0,
      averageTimerLatency: 0,
      averageStintCalculation: 0,
      memoryUsage: null,
      totalMetrics: 0
    }))
  })),
  withPerformanceMonitoring: jest.fn((Component) => Component),
  debounce: jest.fn((fn) => fn),
  throttle: jest.fn((fn) => fn),
  memoize: jest.fn((fn) => fn),
  PERFORMANCE_THRESHOLDS: {
    COMPONENT_RENDER: 16,
    TIMER_UPDATE: 50,
    STINT_CALCULATION: 100,
    MEMORY_WARNING: 50 * 1024 * 1024,
  }
};
