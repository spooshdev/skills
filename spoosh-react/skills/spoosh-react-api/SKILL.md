---
name: Spoosh React API
description: This skill should be used when the user asks about "Spoosh hooks", "useRead", "useWrite", "usePages", "Spoosh React setup", "Spoosh plugins", "cache plugin", "retry plugin", "polling plugin", "optimistic updates", "invalidation", "Spoosh devtools", or mentions using Spoosh with React. Provides comprehensive API knowledge for the @spoosh/react package.
---

# Spoosh React API Reference

Spoosh is a type-safe API toolkit with a composable plugin architecture for TypeScript. This skill provides comprehensive knowledge of the React integration.

## Core Setup

### Installation

```bash
pnpm add @spoosh/core @spoosh/react
```

### Creating the Spoosh Instance

```typescript
import { Spoosh } from "@spoosh/core";
import { create } from "@spoosh/react";

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

// Create React hooks
export const { useRead, useWrite, usePages } = create(spoosh);
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

## Core Hooks

### useRead

Fetch data with automatic caching and state management.

**Signature:**
```typescript
const result = useRead(
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

**Returns:**
- `data: TData | undefined` - Response data
- `loading: boolean` - True during initial fetch
- `fetching: boolean` - True during any fetch
- `error: TError | undefined` - Error if failed
- `trigger(): Promise<Response>` - Manually refetch
- `abort(): void` - Cancel in-flight request
- `meta: PluginResults` - Plugin metadata

**Hook Options (second argument):**

*Core Options:*
- `enabled?: boolean` - Whether to fetch automatically (default: true)
- `tags?: string[] | "all" | "self" | "none"` - Cache tag configuration

*Plugin Options (require corresponding plugins):*
- `staleTime?: number` - Cache duration (cache plugin)
- `retry?: { retries?: number, delay?: number, shouldRetry?: ... }` - Retry config (retry plugin)
- `pollingInterval?: number | (({ data, error }) => number | false)` - Polling interval (polling plugin)
- `refetch?: { onFocus?: boolean, onReconnect?: boolean }` - Refetch config (refetch plugin)
- See `references/plugins-api.md` for all plugin options

### useWrite

Perform mutations (POST, PUT, DELETE).

**Signature:**
```typescript
const result = useWrite(
  (api) => api("path").POST(),  // HTTP method selector (with parentheses)
  hookOptions?                   // Optional hook-level options
);
```

**Returns:**
- `trigger(options): Promise<Response>` - Execute mutation
- `loading: boolean` - Mutation in progress
- `error: TError | undefined` - Error if failed
- `data: TData | undefined` - Response data
- `meta: PluginResults` - Plugin metadata (e.g., `transformedData`)
- `abort(): void` - Cancel request

**Hook Options (second argument):**

*Plugin Options (require corresponding plugins):*
- `transform?: (data: TData) => TTransformed` - Transform response (transform plugin)
- `retry?: { retries?: number, delay?: number }` - Retry config (retry plugin)
- See `references/plugins-api.md` for all plugin options

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

### usePages

Bidirectional pagination with infinite scroll.

**Signature:**
```typescript
const result = usePages(
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

**Returns:**
- `data: TMerged` - Merged data from all pages
- `pages: InfinitePage<TData, TError, TMeta>[]` - All individual page objects
- `loading: boolean` - Initial load
- `fetching: boolean` - Any fetch
- `fetchingNext: boolean` - Fetching next page
- `fetchingPrev: boolean` - Fetching previous page
- `canFetchNext: boolean` - More pages available
- `canFetchPrev: boolean` - Previous pages available
- `fetchNext(): void` - Load next page
- `fetchPrev(): void` - Load previous page
- `trigger(): Promise<void>` - Refetch all pages from the beginning
- `abort(): void` - Cancel requests
- `error: TError | undefined` - Error state
- `meta: PluginResults` - Plugin metadata

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
const { data } = useRead(
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
const { trigger } = useWrite((api) => api("users").POST());

// Invalidate entire hierarchy
await trigger({ body: data, invalidate: "all" });

// Invalidate exact path only
await trigger({ body: data, invalidate: "self" });

// Invalidate specific tags
await trigger({ body: data, invalidate: ["users", "posts"] });

// Invalidate everything
await trigger({ body: data, invalidate: "*" });

// No invalidation
await trigger({ body: data, invalidate: "none" });
```

### Manual Invalidation

Plugin instance APIs are returned from `create()`:

```typescript
// Instance APIs come from create(), not from spoosh
const { useRead, useWrite, invalidate, clearCache } = create(spoosh);

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
- **`references/hooks-api.md`** - Complete hook signatures and options
- **`references/plugins-api.md`** - All plugins with full configuration
- **`references/type-inference.md`** - Server type inference with Hono/Elysia

### Examples

For working code examples, see:
- `examples/react-basic` in the Spoosh repository
- `examples/react-ecommerce` for full e-commerce implementation
