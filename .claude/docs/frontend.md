# Frontend Guidelines

## Stack
- Preact with JSX, bundled by esbuild to `assets/bundle.js`
- Custom router in `commons/components/Router.jsx`
- Local component state and hooks; Preact contexts in `commons/contexts/`

## Component Structure
- Use function components with hooks
- Main exported function/component should always be the top function unless there are hoisting issues
- Early returns for conditional rendering
- Sub-components defined in same file after main component
- Default export when a file has one main function (components, hooks, utilities); named exports when it has several

## Rendering Logic
- Extract logic from components into separate if-else conditions
- Extract map loops to variables outside JSX
- For conditional rendering, use if-else conditions outside JSX to build arrays/variables, not ternary operators or logical AND inside JSX
- Ternary operators in JSX are only acceptable for simple inline styles or class names

## State Management
- Use descriptive state names: `[notes, setNotes]`, `[isNotesLoading, setIsNotesLoading]`
- Local state with `useState`, prop drilling for shared state
- Functional updates for state dependent on previous state

## API Calls
- Use centralized `ApiClient` from `commons/http/ApiClient.js`
- Use specific named methods (e.g., `ApiClient.createUser()`, `ApiClient.getTemplates()`, `ApiClient.getSimilarImages()`) rather than generic HTTP methods
- Promise chains with `.then()`, `.catch()`, `.finally()`
- Consistent error handling with toast notifications
- Skip toast for expected errors using `skipCodes` array

## Naming
- Use `is` prefix for boolean props (`isActive`, `isLoading`)
- Use `has`, `can`, `should` prefixes for other boolean checks
- Handler naming: `handle{Action}Click` (e.g., `handleSaveClick`)

## Function Declarations
- Use `function` keyword for event handlers, utility functions, and render functions
- Use arrow functions only for inline callbacks in JSX and when lexical `this` binding is needed

```javascript
// Preferred: function declarations
function handleSaveClick() { ... }
function renderItems() { ... }

// Acceptable: arrow functions for inline callbacks
onClick={() => handleSaveClick()}
items.map(item => ...)
```

## Boolean Type Checking
- For values that are genuinely booleans, test them directly — no `=== true` / `!== true`
- For values that may be `undefined`, `null`, `0`, or `""`, compare explicitly so the intent is visible and a falsy-but-valid value isn't silently treated as absent

```javascript
// Preferred: real booleans tested directly
if (isEnabled) { ... }
if (!isEnabled) { ... }
if (response.ok) { ... }

// Preferred: explicit checks when the value isn't a boolean
if (count === 0) { ... }
if (name === undefined) { ... }
if (items.length > 0) { ... }

// Avoid: truthy checks that hide a non-boolean
if (count) { ... }
if (name) { ... }
```

## Event Handling
- Keyboard shortcuts with `preventDefault()`
- Click outside patterns for modals using refs and event listeners

## Modal Patterns
- Render to `.modal-root` using `render()` function
- Backdrop click handling with `classList.contains("modal-backdrop-container")`
- Consistent modal structure with header, content, and close button
