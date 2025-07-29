import React, { useState, useEffect, memo } from 'react';
import { performanceMonitor, usePerformanceMonitoring } from '../../utils/performance/performanceMonitoring';
import { Activity, Clock, Cpu, MemoryStick, Zap, AlertTriangle } from 'lucide-react';

interface PerformanceDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const PerformanceDashboard = memo<PerformanceDashboardProps>(({ 
  isVisible = false, 
  onClose 
}) => {
  const { getSummary } = usePerformanceMonitoring('PerformanceDashboard');
  const [performanceData, setPerformanceData] = useState(getSummary());
  const [refreshRate, setRefreshRate] = useState(5000); // 5 seconds

  // Update performance data periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateData = () => {
      const summary = performanceMonitor.getPerformanceSummary();
      setPerformanceData(summary);
    };

    updateData(); // Initial update
    const interval = setInterval(updateData, refreshRate);

    return () => clearInterval(interval);
  }, [isVisible, refreshRate]);

  // Performance status indicators
  const getPerformanceStatus = (avgTime: number, threshold: number) => {
    if (avgTime < threshold * 0.5) return { status: 'excellent', color: 'text-green-400', bg: 'bg-green-900/20' };
    if (avgTime < threshold * 0.8) return { status: 'good', color: 'text-blue-400', bg: 'bg-blue-900/20' };
    if (avgTime < threshold) return { status: 'fair', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    return { status: 'poor', color: 'text-red-400', bg: 'bg-red-900/20' };
  };

  const renderStatus = getPerformanceStatus(performanceData.averageRenderTime, 16);
  const timerStatus = getPerformanceStatus(performanceData.averageTimerLatency, 50);
  const stintStatus = getPerformanceStatus(performanceData.averageStintCalculation, 100);

  // Memory status
  const memoryStatus = performanceData.memoryUsage ? {
    usage: Math.round(performanceData.memoryUsage / 1024 / 1024), // MB
    status: performanceData.memoryUsage > 50 * 1024 * 1024 ? 'high' : 'normal',
    color: performanceData.memoryUsage > 50 * 1024 * 1024 ? 'text-red-400' : 'text-green-400'
  } : null;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-gray-100">Performance Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100"
            >
              <option value={1000}>1s refresh</option>
              <option value={5000}>5s refresh</option>
              <option value={10000}>10s refresh</option>
            </select>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Render Performance */}
            <div className={`p-4 rounded-lg border ${renderStatus.bg} border-gray-600`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className={`h-5 w-5 ${renderStatus.color}`} />
                  <span className="text-sm font-medium text-gray-300">Render Time</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${renderStatus.bg} ${renderStatus.color}`}>
                  {renderStatus.status}
                </span>
              </div>
              <div className={`text-2xl font-bold ${renderStatus.color}`}>
                {performanceData.averageRenderTime.toFixed(2)}ms
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Target: &lt;16ms (60fps)
              </div>
            </div>

            {/* Timer Performance */}
            <div className={`p-4 rounded-lg border ${timerStatus.bg} border-gray-600`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className={`h-5 w-5 ${timerStatus.color}`} />
                  <span className="text-sm font-medium text-gray-300">Timer Latency</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${timerStatus.bg} ${timerStatus.color}`}>
                  {timerStatus.status}
                </span>
              </div>
              <div className={`text-2xl font-bold ${timerStatus.color}`}>
                {performanceData.averageTimerLatency.toFixed(2)}ms
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Target: &lt;50ms
              </div>
            </div>

            {/* Stint Calculations */}
            <div className={`p-4 rounded-lg border ${stintStatus.bg} border-gray-600`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className={`h-5 w-5 ${stintStatus.color}`} />
                  <span className="text-sm font-medium text-gray-300">Calculations</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${stintStatus.bg} ${stintStatus.color}`}>
                  {stintStatus.status}
                </span>
              </div>
              <div className={`text-2xl font-bold ${stintStatus.color}`}>
                {performanceData.averageStintCalculation.toFixed(2)}ms
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Target: &lt;100ms
              </div>
            </div>

            {/* Memory Usage */}
            <div className="p-4 rounded-lg border border-gray-600 bg-gray-900/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">Memory</span>
                </div>
                {memoryStatus && (
                  <span className={`text-xs px-2 py-1 rounded bg-purple-900/20 ${memoryStatus.color}`}>
                    {memoryStatus.status}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {memoryStatus ? `${memoryStatus.usage}MB` : 'N/A'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {memoryStatus ? 'JS Heap Size' : 'Not available'}
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <div className="bg-gray-900/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Performance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Metrics Collected:</span>
                  <span className="text-gray-100 font-medium">{performanceData.totalMetrics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Render Time:</span>
                  <span className={renderStatus.color}>
                    {performanceData.averageRenderTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Timer Latency:</span>
                  <span className={timerStatus.color}>
                    {performanceData.averageTimerLatency.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Stint Calculation:</span>
                  <span className={stintStatus.color}>
                    {performanceData.averageStintCalculation.toFixed(2)}ms
                  </span>
                </div>
                {memoryStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory Usage:</span>
                    <span className={memoryStatus.color}>
                      {memoryStatus.usage}MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Recommendations */}
            <div className="bg-gray-900/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Recommendations</h3>
              <div className="space-y-2">
                {performanceData.averageRenderTime > 16 && (
                  <div className="flex items-start gap-2 p-2 bg-red-900/20 rounded text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-red-300">
                      Render time is above 60fps threshold. Consider optimizing component re-renders.
                    </span>
                  </div>
                )}
                {performanceData.averageTimerLatency > 50 && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-900/20 rounded text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-300">
                      Timer updates are slow. Check for blocking operations in timer callbacks.
                    </span>
                  </div>
                )}
                {performanceData.averageStintCalculation > 100 && (
                  <div className="flex items-start gap-2 p-2 bg-orange-900/20 rounded text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <span className="text-orange-300">
                      Stint calculations are taking too long. Consider caching or optimizing algorithms.
                    </span>
                  </div>
                )}
                {memoryStatus && memoryStatus.status === 'high' && (
                  <div className="flex items-start gap-2 p-2 bg-purple-900/20 rounded text-sm">
                    <AlertTriangle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-purple-300">
                      High memory usage detected. Check for memory leaks or excessive data retention.
                    </span>
                  </div>
                )}
                {/* Good performance message */}
                {performanceData.averageRenderTime <= 16 && 
                 performanceData.averageTimerLatency <= 50 && 
                 performanceData.averageStintCalculation <= 100 && (
                  <div className="flex items-start gap-2 p-2 bg-green-900/20 rounded text-sm">
                    <Zap className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-green-300">
                      Performance is excellent! All metrics are within optimal ranges.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Development Note */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-400/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Activity className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-blue-300 font-medium mb-1">Development Mode</div>
                  <div className="text-blue-200 text-sm">
                    Performance monitoring is active. Press Ctrl+Shift+P to toggle this dashboard.
                    This will not appear in production builds.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

// Hook to easily toggle performance dashboard
export const usePerformanceDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible(!isVisible);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  // Keyboard shortcut to toggle dashboard (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isVisible,
    toggle,
    show,
    hide,
    PerformanceDashboard: ({ onClose }: { onClose?: () => void }) => (
      <PerformanceDashboard 
        isVisible={isVisible} 
        onClose={onClose || hide} 
      />
    )
  };
};
