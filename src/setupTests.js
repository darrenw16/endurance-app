// Basic test setup
import '@testing-library/jest-dom';

// Mock common browser APIs - use simple functions instead of jest.fn()
Object.defineProperty(window, 'alert', {
  value: () => {},
  writable: true,
});

Object.defineProperty(window, 'confirm', {
  value: () => true,
  writable: true,
});

// Mock observers
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
