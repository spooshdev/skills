---
name: Spoosh Angular API
description: This skill should be used when the user asks about "Spoosh injects", "injectRead", "injectWrite", "injectPages", "injectQueue", "Spoosh Angular setup", "Spoosh plugins", "cache plugin", "retry plugin", "polling plugin", "optimistic updates", "invalidation", "Spoosh devtools", or mentions using Spoosh with Angular. Provides comprehensive API knowledge for the @spoosh/angular package.
---

# Spoosh Angular API Reference

Spoosh is a type-safe API toolkit with a composable plugin architecture for TypeScript. This skill provides comprehensive knowledge of the Angular integration using signals.

## Core Setup

### Installation

```bash
pnpm add @spoosh/core @spoosh/angular
```

### Creating the Spoosh Instance

```typescript
import { Spoosh } from "@spoosh/core";
import { create } from "@spoosh/angular";

// Define API schema
type ApiSchema = {
  "users": {
    GET: { data: User[] };
    POST: { data: User; body: CreateUserBody };
  };
  "users/:id": {
    GET: { data: User };
    PUT: { data: User; body: UpdateUserBody };
    DELETE: { data: void };
  };
};

// Create Spoosh instance with plugins
const spoosh = new Spoosh<ApiSchema, Error>("/api")
  .use([cachePlugin(), retryPlugin()]);

// Create Angular inject functions
export const { injectRead, injectWrite, injectPages, injectQueue } = create(spoosh);
```

## Body Utilities

Spoosh provides utilities for different request body formats from `@spoosh/core`:

```typescript
import { form, json, urlencoded } from "@spoosh/core";

// JSON (default for plain objects) - application/json
await trigger({ body: { name: "John" } });  // Auto-serialized as JSON
await trigger({ body: json({ name: "John" }) });  // Explicit JSON

// Form data - multipart/form-data (supports files and binary data)
await trigger({ body: form({ file: myFile, name: "photo" }) });

// URL-encoded - application/x-www-form-urlencoded
await trigger({ body: urlencoded({ username: "john", password: "secret" }) });
```

## Core Inject Functions

### injectRead

Fetch data with automatic caching and state management. Returns signals.

**Signature:**
```typescript
const result = injectRead(
  (api) => api("path").GET(requestOptions?),  // Request options here
  hookOptions?                                 // Hook options here
);

// Request options (in the API call):
api("users/:id").GET({
  params: { id: "123" },           // URL path parameters
  query: { include: "posts" },     // Query string parameters
  headers: { "X-Custom": "value" } // Request headers
});
```

**Returns (all signals except trigger/abort):**
- `data: Signal<TData | undefined>` - Response data
- `loading: Signal<boolean>` - True during initial fetch
- `fetching: Signal<boolean>` - True during any fetch
- `error: Signal<TError | undefined>` - Error if failed
- `trigger(): Promise<Response>` - Manually refetch
- `abort(): void` - Cancel in-flight request
- `meta: Signal<PluginResults>` - Plugin metadata

**Hook Options (second argument):**

*Core Options:*
- `enabled?: boolean | Signal<boolean> | (() => boolean)` - Whether to fetch automatically (default: true)
- `tags?: string[] | "all" | "self" | "none"` - Cache tag configuration

*Plugin Options (require corresponding plugins):*
- `staleTime?: number` - Cache duration (cache plugin)
- `retry?: { retries?: number, delay?: number, shouldRetry?: ... }` - Retry config (retry plugin)
- `pollingInterval?: number | (({ data, error }) => number | false)` - Polling interval (polling plugin)
- `refetch?: { onFocus?: boolean, onReconnect?: boolean }` - Refetch config (refetch plugin)
- See `references/plugins-api.md` for all plugin options

### injectWrite

Perform mutations (POST, PUT, DELETE). Returns signals.

**Signature:**
```typescript
const result = injectWrite(
  (api) => api("path").POST(),  // HTTP method selector (with parentheses)
  hookOptions?                   // Optional hook-level options
);
```

**Returns (all signals except trigger/abort):**
- `trigger(options): Promise<Response>` - Execute mutation
- `loading: Signal<boolean>` - Mutation in progress
- `error: Signal<TError | undefined>` - Error if failed
- `data: Signal<TData | undefined>` - Response data
- `meta: Signal<PluginResults>` - Plugin metadata (e.g., `transformedData`)
- `input: Signal<{ body?: TBody; params?: TParams; query?: TQuery } | undefined>` - Last trigger input
- `abort(): void` - Cancel request

**Trigger Options (passed to trigger()):**
- `body?: TBody` - Request body
- `params?: Record<string, string>` - URL path parameters
- `query?: Record<string, any>` - Query string parameters
- `headers?: Record<string, string>` - Request headers

*Plugin Trigger Options (when plugins are installed):*
- `invalidate?: "all" | "self" | "none" | string[]` - Cache invalidation (invalidation plugin)
- `clearCache?: boolean` - Clear cache after mutation (cache plugin)
- `optimistic?: (cache) => cache("path").filter(...).set(...)` - Optimistic update using fluent API (optimistic plugin)
- `nextjs?: { revalidatePaths?: string[], serverRevalidate?: boolean }` - Next.js revalidation (nextjs plugin)
- See `references/plugins-api.md` for all plugin options

### injectQueue

Queue management for batch operations with concurrency control.

**Signature:**
```typescript
const result = injectQueue(
  (api) => api("items/:id").POST(),  // Request function
  { concurrency: 3 }                  // Max parallel requests (default: 3)
);
```

**Returns (signals for tasks and stats):**
- `tasks: Signal<QueueItem[]>` - All queued tasks with status
- `stats: Signal<QueueStats>` - Queue statistics
- `trigger(options): Promise<Response>` - Add task to queue and execute
- `abort(id?): void` - Abort task by ID, or all tasks if no ID
- `retry(id?): Promise<void>` - Retry failed task by ID, or all failed if no ID
- `remove(id): void` - Remove specific task by ID
- `removeSettled(): void` - Remove all settled tasks (success/error/aborted)
- `clear(): void` - Abort all and clear queue
- `setConcurrency(n): void` - Update concurrency limit

**QueueItem:**
```typescript
interface QueueItem<TData, TError, TMeta> {
  id: string;
  status: "pending" | "loading" | "success" | "error" | "aborted";
  data?: TData;
  error?: TError;
  meta?: TMeta;
  input: { body?: TBody; params?: TParams; query?: TQuery };
}
```

**QueueStats:**
```typescript
interface QueueStats {
  pending: number;    // Tasks waiting to run
  loading: number;    // Currently executing tasks
  settled: number;    // Completed tasks (success + error + aborted)
  success: number;    // Successfully completed tasks
  failed: number;     // Failed tasks
  total: number;      // All tasks
  percentage: number; // Completion percentage (0-100)
}
```

### injectPages

Bidirectional pagination with infinite scroll.

**Signature:**
```typescript
const result = injectPages(
  (api) => api("posts").GET({ query: { page: 1 } }),
  {
    canFetchNext: ({ lastPage }) => lastPage?.data?.meta.hasMore ?? false,
    nextPageRequest: ({ lastPage, request }) => ({
      query: { ...request.query, page: (lastPage?.data?.meta.page ?? 0) + 1 }
    }),
    merger: (pages) => pages.flatMap(p => p.data?.items ?? []),
    // Optional: Previous page support
    canFetchPrev: ({ firstPage }) => (firstPage?.data?.meta.page ?? 1) > 1,
    prevPageRequest: ({ firstPage, request }) => ({
      query: { ...request.query, page: (firstPage?.data?.meta.page ?? 2) - 1 }
    })
  }
);
```

**InfinitePage Structure:**
```typescript
interface InfinitePage<TData, TError, TMeta> {
  status: "pending" | "loading" | "success" | "error" | "stale";
  data?: TData;
  error?: TError;
  meta?: TMeta;
  input?: InfiniteRequestOptions;
}
```

**Returns (all signals except methods):**
- `data: Signal<TMerged>` - Merged data from all pages
- `pages: Signal<InfinitePage<TData, TError, TMeta>[]>` - All individual page objects
- `loading: Signal<boolean>` - Initial load
- `fetching: Signal<boolean>` - Any fetch
- `fetchingNext: Signal<boolean>` - Fetching next page
- `fetchingPrev: Signal<boolean>` - Fetching previous page
- `canFetchNext: Signal<boolean>` - More pages available
- `canFetchPrev: Signal<boolean>` - Previous pages available
- `fetchNext(): void` - Load next page
- `fetchPrev(): void` - Load previous page
- `trigger(): Promise<void>` - Refetch all pages from the beginning
- `abort(): void` - Cancel requests
- `error: Signal<TError | undefined>` - Error state
- `meta: Signal<PluginResults>` - Plugin metadata

## Plugin System

### Available Plugins

| Plugin | Purpose | Key Options |
|--------|---------|-------------|
| `cachePlugin` | Response caching | `staleTime`, `clearCache` |
| `retryPlugin` | Automatic retries | `retry: { retries, delay, shouldRetry }` |
| `pollingPlugin` | Auto-refresh | `pollingInterval: number \| (({ data, error }) => ...)` |
| `debouncePlugin` | Debounce requests | `debounce` |
| `throttlePlugin` | Rate limiting | `throttle` |
| `deduplicationPlugin` | Prevent duplicates | Automatic |
| `invalidationPlugin` | Cache invalidation | `invalidate` |
| `optimisticPlugin` | Instant UI updates | `optimistic` (fluent API with `.filter()`, `.set()`) |
| `initialDataPlugin` | Show data immediately | `initialData` |
| `refetchPlugin` | Refetch on focus/reconnect | `refetch: { onFocus, onReconnect }` |
| `prefetchPlugin` | Preload data | Manual via instance API, `timeout` option |
| `transformPlugin` | Transform responses | `transform` |
| `gcPlugin` | Garbage collection | `maxAge`, `maxEntries`, `interval`, `runGc()` instance API |
| `qsPlugin` | Query string serialization | `serializer` |
| `progressPlugin` | Upload/download progress | Returns progress in meta |
| `nextjsPlugin` | Next.js revalidation | `nextjs: { revalidatePaths, serverRevalidate }` |

### Plugin Setup

```typescript
import { cachePlugin } from "@spoosh/plugin-cache";
import { retryPlugin } from "@spoosh/plugin-retry";
import { invalidationPlugin } from "@spoosh/plugin-invalidation";

const spoosh = new Spoosh<ApiSchema, Error>("/api")
  .use([
    cachePlugin({ staleTime: 30000 }),
    retryPlugin({ retries: 3, delay: 1000 }),
    invalidationPlugin()
  ]);
```

### Per-Request Plugin Options

```typescript
data = injectRead(
  (api) => api("users").GET(),
  {
    staleTime: 60000,                             // Cache for 60s
    retry: { retries: 5, delay: 1000 },           // Retry 5 times with 1s delay
    pollingInterval: 10000,                       // Poll every 10s
    refetch: { onFocus: true, onReconnect: true } // Refetch on focus/reconnect
  }
);
```

## Cache Invalidation

Spoosh auto-generates tags from path hierarchy (with resolved params):
- `api("users").GET()` → `["users"]`
- `api("users/:id").GET({ params: { id: "123" } })` → `["users", "users/123"]`
- `api("users/:id/posts").GET({ params: { id: "123" } })` → `["users", "users/123", "users/123/posts"]`

### Invalidation Modes

```typescript
mutation = injectWrite((api) => api("users").POST());

// Invalidate entire hierarchy
await mutation.trigger({ body: data, invalidate: "all" });

// Invalidate exact path only
await mutation.trigger({ body: data, invalidate: "self" });

// Invalidate specific tags
await mutation.trigger({ body: data, invalidate: ["users", "posts"] });

// Invalidate everything
await mutation.trigger({ body: data, invalidate: "*" });

// No invalidation
await mutation.trigger({ body: data, invalidate: "none" });
```

### Manual Invalidation

Plugin instance APIs are returned from `create()`:

```typescript
// Instance APIs come from create(), not from spoosh
const { injectRead, injectWrite, invalidate, clearCache } = create(spoosh);

// Invalidate specific tags
invalidate(["users"]);

// Invalidate all
invalidate("*");

// Clear cache
clearCache();
clearCache({ refetchAll: true });
```

## Additional Resources

### Reference Files

For detailed API documentation, consult:
- **`references/signals-api.md`** - Complete inject function signatures and options
- **`references/plugins-api.md`** - All plugins with full configuration
- **`references/type-inference.md`** - Server type inference with Hono/Elysia

### Examples

For working code examples, see:
- `examples/angular-basic` in the Spoosh repository
- `examples/angular-ecommerce` for full e-commerce implementation
