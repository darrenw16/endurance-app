# Accessibility Fixes for React Testing Library

## Problem
The unit tests were failing with errors like:
```
TestingLibraryElementError: Found a label with the text of: /track name/i, however no form control was found associated to that label. Make sure you're using the "for" attribute or "aria-labelledby" attribute correctly.
```

## Root Cause
The form labels in the race configuration screen were not properly associated with their corresponding input fields. React Testing Library's `getByLabelText()` function requires labels to be connected to inputs via:
- `htmlFor` attribute on the label pointing to the input's `id`
- OR `aria-labelledby` attribute on the input pointing to the label's `id`

## Solution Applied
Added proper `htmlFor` attributes to all labels and matching `id` attributes to all inputs:

### Fixed Form Fields

1. **Track Name**
   - Label: `htmlFor="track-name"`
   - Input: `id="track-name"`

2. **Race Length**
   - Label: `htmlFor="race-length"`
   - Input: `id="race-length"`

3. **Fuel Range**
   - Label: `htmlFor="fuel-range"`
   - Input: `id="fuel-range"`

4. **Minimum Pit Time**
   - Label: `htmlFor="min-pit-time"`
   - Input: `id="min-pit-time"`

5. **Team Number** (Dynamic)
   - Label: `htmlFor={\`team-number-\${teamIndex}\`}`
   - Input: `id={\`team-number-\${teamIndex}\`}`

6. **Team Name** (Dynamic)
   - Label: `htmlFor={\`team-name-\${teamIndex}\`}`
   - Input: `id={\`team-name-\${teamIndex}\`}`

7. **Driver Inputs** (Dynamic)
   - Input: `id={\`driver-\${teamIndex}-\${driverIndex}\`}`
   - Added: `aria-label={\`Driver \${driverIndex + 1} for Team \${teamIndex + 1}\`}`

## Files Modified
- `src/App.tsx` - Added accessibility attributes to all form elements

## Tests That Should Now Pass

```javascript
// These getByLabelText calls should now work:
screen.getByLabelText(/track name/i)
screen.getByLabelText(/race length/i) 
screen.getByLabelText(/fuel range/i)
screen.getByLabelText(/minimum pit time/i)
```

## Verification Steps

1. **Run the tests:**
   ```bash
   npm test -- --testPathPattern=App.test.tsx
   ```

2. **Check specific accessibility test:**
   ```bash
   npm test -- --testNamePattern="has proper form labels"
   ```

3. **Manual verification with screen reader:**
   - Start the app: `npm start`
   - Use screen reader to navigate form fields
   - Each label should be properly announced with its input

## Expected Results

After these fixes, all the following tests should pass:
- ✅ "renders race configuration screen initially"
- ✅ "start race button is enabled when all required fields are filled"
- ✅ "can start a race and transitions to race view"
- ✅ "displays race timer when race is started"
- ✅ "can pause and resume race"
- ✅ "can toggle FCY status"
- ✅ "can open pit stop dialog"
- ✅ "can confirm pit stop"
- ✅ "handles invalid fuel range input"
- ✅ "has proper form labels"

## Additional Benefits

1. **Improved Accessibility:**
   - Better screen reader support
   - Keyboard navigation improvements
   - WCAG 2.1 AA compliance

2. **Better Testing:**
   - More reliable test selectors
   - Follows testing best practices
   - Reduces flaky tests

3. **Better UX:**
   - Clicking labels now focuses inputs
   - More intuitive form interaction

## Why This Fix Works

React Testing Library's `getByLabelText()` function simulates how users (especially those using assistive technologies) interact with forms. It looks for:

1. A `<label>` element with `htmlFor` attribute pointing to an input's `id`
2. An input with `aria-labelledby` pointing to a label's `id`
3. A label wrapping an input element

Our fix uses approach #1, which is the most common and recommended pattern.

## Running the Fixed Tests

To verify the fixes work:

```bash
# Run all tests
npm test

# Run only the App tests
npm test App.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

All previously failing tests should now pass! 🎉
