// Simple test to debug accessibility issues
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

describe('Debug Accessibility', () => {
  test('debug form fields', () => {
    render(<App />);
    
    // Debug what's actually rendered
    console.log('=== DEBUGGING FORM FIELDS ===');
    
    // Try to find the track name input by different methods
    try {
      const trackNameByLabel = screen.getByLabelText(/track name/i);
      console.log('✅ Found track name by label:', trackNameByLabel);
    } catch (error) {
      console.log('❌ Could not find track name by label:', error.message);
    }
    
    try {
      const trackNameById = screen.getByDisplayValue('');
      console.log('✅ Found empty input field:', trackNameById);
    } catch (error) {
      console.log('❌ Could not find empty input field:', error.message);
    }
    
    try {
      const trackNameByPlaceholder = screen.getByPlaceholderText('Enter track name...');
      console.log('✅ Found track name by placeholder:', trackNameByPlaceholder);
    } catch (error) {
      console.log('❌ Could not find track name by placeholder:', error.message);
    }
    
    // Try to find all labels
    const allLabels = screen.getAllByText(/track name|race length|fuel range|minimum pit time/i);
    console.log('All labels found:', allLabels.length);
    
    // Check if we can find any inputs
    const allInputs = document.querySelectorAll('input');
    console.log('Total inputs found:', allInputs.length);
    
    allInputs.forEach((input, index) => {
      console.log(`Input ${index}:`, {
        id: input.id,
        type: input.type,
        placeholder: input.placeholder,
        value: input.value
      });
    });
    
    // Check labels
    const allLabelsElements = document.querySelectorAll('label');
    console.log('Total labels found:', allLabelsElements.length);
    
    allLabelsElements.forEach((label, index) => {
      console.log(`Label ${index}:`, {
        htmlFor: label.htmlFor,
        textContent: label.textContent
      });
    });
    
    console.log('=== END DEBUG ===');
    
    // This test will always pass, it's just for debugging
    expect(true).toBe(true);
  });
});
