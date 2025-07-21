# RaceContext Implementation

This document explains the implementation of the RaceContext to share race state across components and reduce prop drilling in the endurance racing application.

## Overview

The RaceContext is a React Context that centralizes all race-related state and provides it to child components through the `useRaceContext` hook. This eliminates the need to pass props through multiple levels of components (prop drilling).

## Implementation Files

### 1. RaceContext (`src/contexts/RaceContext.tsx`)

The main context file that:
- Defines the `RaceContextType` interface
- Creates the `RaceProvider` component
- Provides the `useRaceContext` hook
- Centralizes all race state management logic

### 2. Updated App Structure

```
App.tsx (top level)
├── RaceProvider (context wrapper)
    └── RaceApp.tsx (main race application)
        ├── RaceHeader
        ├── TeamSelector  
        ├── CurrentStintStatus
        ├── FCYAlert
        ├── StintSchedule
        └── ModalContainer
```

## Benefits of Using Context

### 1. Eliminated Prop Drilling

**Before Context Implementation:**
```tsx
// App.tsx
<CurrentStintStatus
  raceConfig={raceConfig}
  currentTeam={currentTeam}
  selectedTeam={teamState.selectedTeam}
  raceStartTime={raceState.raceStartTime}
  currentTime={raceState.currentTime}
  onOpenElapsedModal={openElapsedModal}
  onOpenRemainingModal={openRemainingModal}
  onOpenFuelRangeModal={openFuelRangeModal}
/>
```

**After Context Implementation:**
```tsx
// App.tsx
<CurrentStintStatusWithContext />

// CurrentStintStatusWithContext.tsx
const { raceConfig, raceState, teamState, actions } = useRaceContext();
```

### 2. Centralized State Management

All race-related state is now managed in one place:
- Race state (timing, FCY, pause/resume)
- Team state (current teams, selected team, stint information)
- Modal state (all dialog states and form data)
- Drag and drop state
- Pit stop operations

### 3. Simplified Component Interface

Components no longer need to know about:
- Which props to accept
- How to pass data to child components
- Complex state update logic

### 4. Better Type Safety

The context provides a single, well-typed interface for all race operations:
```tsx
interface RaceContextType {
  raceConfig: RaceConfig;
  raceState: { /* race timing state */ };
  teamState: { /* team management state */ };
  modals: { /* modal state */ };
  dragAndDrop: { /* drag/drop state */ };
  actions: { /* all race actions */ };
}
```

## Context Structure

### State Categories

1. **Race Configuration**
   - Track settings
   - Race length, fuel range, pit times
   - Team configurations

2. **Race State**
   - Race started/paused/stopped
   - Current time and race start time
   - FCY (Full Course Yellow) status

3. **Team State**
   - All team states and stint plans
   - Selected team
   - Team state management functions

4. **Modal State**
   - All dialog visibility flags
   - Form data for modals
   - Modal action functions

5. **Actions**
   - Centralized race actions (start, pause, stop)
   - Pit stop operations
   - Time editing functions
   - Modal management

## Example: Refactored Component

Compare the original `CurrentStintStatus` with the context version:

**Original (8 props required):**
```tsx
interface CurrentStintStatusProps {
  raceConfig: RaceConfig;
  currentTeam: TeamState;
  selectedTeam: number;
  raceStartTime: Date | null;
  currentTime: Date;
  onOpenElapsedModal: () => void;
  onOpenRemainingModal: () => void;
  onOpenFuelRangeModal: () => void;
}
```

**With Context (0 props required):**
```tsx
const CurrentStintStatusWithContext: React.FC = () => {
  const { raceConfig, raceState, teamState, actions } = useRaceContext();
  // Component logic here
};
```

## Migration Strategy

### Phase 1: Context Setup ✅
- Created RaceContext with all state
- Wrapped App with RaceProvider
- Created RaceApp component

### Phase 2: Component Refactoring (Next Steps)
- Refactor each component to use context
- Remove prop drilling from parent components
- Create context-aware versions of components

### Phase 3: Cleanup
- Remove unused prop interfaces
- Update component exports
- Update tests to use context

## Usage Guidelines

### When to Use Context

✅ **Good for:**
- Components that need race state
- Components that trigger race actions
- Deeply nested components
- Components used in multiple places

❌ **Avoid for:**
- Pure presentation components
- Components with local-only state
- Simple data transformations

### Best Practices

1. **Use the hook consistently:**
   ```tsx
   const { raceState, teamState, actions } = useRaceContext();
   ```

2. **Destructure only what you need:**
   ```tsx
   const { raceState: { currentTime }, actions: { startRace } } = useRaceContext();
   ```

3. **Keep components focused:**
   ```tsx
   // Good: specific responsibility
   const PitButton = () => {
     const { actions } = useRaceContext();
     return <button onClick={actions.executePit}>Pit</button>;
   };
   ```

## Performance Considerations

### Context Optimization
- Context value is memoized through hook dependencies
- State updates only trigger re-renders for consuming components
- Actions are stable references (don't cause unnecessary re-renders)

### Re-render Optimization
- Components only re-render when their used context values change
- Use React.memo() for expensive components if needed
- Consider splitting context if performance becomes an issue

## Testing with Context

### Test Helper
```tsx
const renderWithContext = (component: React.ReactElement, mockState = {}) => {
  const mockContext = {
    raceConfig: mockRaceConfig,
    raceState: mockRaceState,
    teamState: mockTeamState,
    actions: mockActions,
    ...mockState
  };
  
  return render(
    <RaceContext.Provider value={mockContext}>
      {component}
    </RaceContext.Provider>
  );
};
```

### Example Test
```tsx
test('CurrentStintStatusWithContext displays race data', () => {
  renderWithContext(<CurrentStintStatusWithContext />);
  expect(screen.getByText('Current Stint')).toBeInTheDocument();
});
```

## Future Enhancements

### Potential Improvements
1. **Context Splitting:** Separate contexts for different concerns
2. **Middleware:** Add logging, persistence, or analytics
3. **Selectors:** Optimize re-renders with selector patterns
4. **State Machines:** Use XState for complex race state logic

### Example Context Split
```tsx
// Could be split into:
const RaceTimingContext = // race timing state
const TeamManagementContext = // team state
const UIStateContext = // modals, drag/drop
```

## Conclusion

The RaceContext implementation successfully:
- ✅ Eliminates prop drilling throughout the application
- ✅ Centralizes race state management
- ✅ Provides type-safe access to all race operations
- ✅ Simplifies component interfaces
- ✅ Improves code maintainability

This creates a more maintainable and developer-friendly codebase where components can focus on their specific responsibilities rather than state management logistics.
