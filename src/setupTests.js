// src/setupTests.js
import '@testing-library/jest-dom';

// Mock window.alert for tests (using vi instead of jest for better compatibility)
Object.defineProperty(window, 'alert', {
  value: () => {},
  writable: true,
});

// Mock window.confirm for tests  
Object.defineProperty(window, 'confirm', {
  value: () => true,
  writable: true,
});

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
global.console = {
  ...console,
  // Uncomment to silence console.log in tests
  // log: () => {},
  warn: () => {},
  error: () => {},
};

// Mock IntersectionObserver if needed
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver if needed
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Note: Timer setup is moved to individual tests since jest globals aren't available here