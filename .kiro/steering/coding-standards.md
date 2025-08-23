---
inclusion: always
---

# Coding Standards

## Functional Programming Approach

**CRITICAL REQUIREMENT**: Always use functional programming patterns instead of class-based implementations.

### ✅ Preferred Patterns

**Use pure functions and functional composition:**
```typescript
// ✅ GOOD: Functional approach
export async function processData(input: string, config: Config): Promise<Result> {
  return await apiCall(input, config);
}

export function createConfig(token?: string): Config {
  return { token, baseUrl: 'https://api.example.com' };
}
```

**Use higher-order functions and composition:**
```typescript
// ✅ GOOD: Functional composition
export const withAuth = (config: Config) => (fn: Function) => 
  (...args: any[]) => fn(...args, config);

export const authenticatedCall = withAuth(config)(apiCall);
```

### ❌ Avoid These Patterns

**Never use class-based implementations:**
```typescript
// ❌ BAD: Class-based approach
export class ApiService {
  private config: Config;
  
  constructor(config: Config) {
    this.config = config;
  }
  
  async processData(input: string): Promise<Result> {
    return await this.apiCall(input);
  }
}
```

### Implementation Guidelines

1. **State Management**: Pass configuration and state as function parameters rather than storing in class instances
2. **Modularity**: Export individual functions that can be composed together
3. **Immutability**: Prefer immutable data structures and avoid mutating inputs
4. **Pure Functions**: Functions should be predictable and side-effect free when possible
5. **Composition**: Build complex functionality by composing simpler functions
6. **Type Safety**: Never use `any` type - use `unknown`, specific types, or generics instead

### Service Layer Pattern

For service layers, use functional modules:

```typescript
// ✅ GOOD: Functional service module
export interface ServiceConfig {
  token?: string;
  baseUrl: string;
}

export async function getData(id: string, config: ServiceConfig): Promise<Data> {
  // Implementation
}

export async function updateData(id: string, data: Data, config: ServiceConfig): Promise<Data> {
  // Implementation
}

// Usage
const config = { baseUrl: 'https://api.example.com', token: 'abc123' };
const result = await getData('123', config);
```

### Type Safety

**CRITICAL REQUIREMENT**: Never use `any` type. Always use proper typing.

```typescript
// ❌ BAD: Using any
function processData(data: any): any {
  return data.someProperty;
}

// ✅ GOOD: Use unknown for truly unknown data
function processData(data: unknown): string | null {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return String((data as { someProperty: unknown }).someProperty);
  }
  return null;
}

// ✅ GOOD: Use generics for flexible typing
function processData<T>(data: T, processor: (item: T) => string): string {
  return processor(data);
}

// ✅ GOOD: Use specific interfaces
interface ApiResponse {
  data: string;
  status: number;
}

function processApiResponse(response: ApiResponse): string {
  return response.data;
}
```

### Error Handling

Use functional error handling patterns:

```typescript
// ✅ GOOD: Result type pattern
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export async function safeApiCall(input: string): Promise<Result<Data>> {
  try {
    const data = await apiCall(input);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

This approach ensures:
- Better testability
- Easier reasoning about code behavior
- Improved composability
- Reduced coupling
- Enhanced maintainability