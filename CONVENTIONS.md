# WASMScriber Development Conventions

## Project Metadata
- Copyright: (C) 2025 Robin L. M. Cheung, MBA
- Repository: https://github.com/rebots-online/WASMScriber.git
- Branch Strategy: Use 'master' as primary branch

## Code Organization

### Directory Structure
```
src/
├── app/                    # Next.js app router pages
├── components/            # React components
└── lib/                   # Core functionality
    ├── contexts/         # React contexts
    ├── db/              # Database utilities
    ├── types/           # TypeScript definitions
    └── workers/         # Web Workers
```

### File Naming
- React Components: PascalCase (e.g., `WhisperVoiceRecorder.tsx`)
- Utilities: camelCase (e.g., `audioUtils.ts`)
- Types/Interfaces: PascalCase (e.g., `WhisperConfig.ts`)
- Worker files: kebab-case (e.g., `whisper-worker.ts`)

### Code Style
- Use TypeScript strict mode
- Prefer functional components
- Use named exports
- Use type inference where obvious

## Documentation

### File Headers
```typescript
/**
 * @file [filename]
 * @description [brief description]
 * @copyright (C) 2025 Robin L. M. Cheung, MBA
 */
```

### Function Documentation
```typescript
/**
 * @function functionName
 * @description What the function does
 * @param {type} paramName - Parameter description
 * @returns {type} Description of return value
 * @throws {ErrorType} When/why it throws
 */
```

### Component Documentation
```typescript
/**
 * @component ComponentName
 * @description Component purpose and usage
 * @prop {type} propName - Prop description
 * @example
 * <ComponentName prop="value" />
 */
```

## Git Workflow

### Commit Messages
Format: `type(scope): description`

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

### Branch Naming
- feature/description
- fix/description
- docs/description

## Testing

### Unit Tests
- File naming: `*.test.ts` or `*.test.tsx`
- One test file per module
- Use descriptive test names

### Test Structure
```typescript
describe('Module', () => {
  describe('function/component', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

## WebAssembly Conventions

### Memory Management
- Always free allocated memory
- Use structured memory pools
- Document memory requirements

### Worker Communication
- Use typed messages
- Handle all possible states
- Implement error recovery

## Error Handling

### Error Types
```typescript
type AppError = {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
};
```

### Error Logging
- Include stack traces
- Log context information
- Use error codes

## Performance

### WebAssembly
- Minimize memory copies
- Use appropriate memory alignment
- Profile hot paths

### React
- Memoize expensive computations
- Use appropriate suspense boundaries
- Implement proper cleanup

## Security

### Data Handling
- No sensitive data in logs
- Sanitize user inputs
- Use secure defaults

### WASM Security
- Validate input buffers
- Handle memory exceptions
- Implement resource limits

## Build Process

### Environment Variables
```bash
NEXT_PUBLIC_APP_VERSION=x.x.x
NODE_ENV=development|production
```

### Build Commands
- `npm run dev`: Development
- `npm run build`: Production build
- `npm run test`: Run tests

---

This document should be reviewed and updated as needed. All team members should follow these conventions for consistency and maintainability.

Last Updated: 2025-03-01