import '@testing-library/jest-dom';

// Simple test setup - just the essentials
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Mock IntersectionObserver with proper type implementation
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {}
  
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock ResizeObserver with proper type implementation
global.ResizeObserver = class ResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
