import { renderHook, act } from '@testing-library/react';
import { useOptimizedTimer } from '../../hooks/useOptimizedTimer';

describe('useOptimizedTimer Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns current time', () => {
    const { result } = renderHook(() => useOptimizedTimer());
    
    expect(result.current.currentTime).toBeInstanceOf(Date);
  });

  test('provides forceUpdate function', () => {
    const { result } = renderHook(() => useOptimizedTimer());
    
    expect(typeof result.current.forceUpdate).toBe('function');
  });

  test('returns lastUpdateTime', () => {
    const { result } = renderHook(() => useOptimizedTimer());
    
    expect(typeof result.current.lastUpdateTime).toBe('number');
  });

  test('can force update time', () => {
    const { result } = renderHook(() => useOptimizedTimer());
    
    act(() => {
      result.current.forceUpdate();
    });
    
    expect(result.current.currentTime).toBeInstanceOf(Date);
  });
});
