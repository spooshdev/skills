---
name: Spoosh Angular API
description: This skill should be used when the user asks about "Spoosh signals", "injectRead", "injectWrite", "injectPages", "Spoosh Angular setup", "Spoosh plugins", "cache plugin", "retry plugin", "polling plugin", "optimistic updates", "invalidation", "Spoosh devtools", or mentions using Spoosh with Angular. Provides comprehensive API knowledge for the @spoosh/angular package.
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
export const { injectRead, injectWrite, injectPages } = create(spoosh);
```

## Body Utilities

Spoosh provides utilities for different request body formats from `@spoosh/core`:

```typescript
import { form, json, urlencoded } from "@spoosh/core";

// JSON (default for plain objects) - application/json
await this.mutation.trigger({ body: { name: "John" } });  // Auto-serialized as JSON
await this.mutation.trigger({ body: json({ name: "John" }) });  // Explicit JSON

// Form data - multipart/form-data (supports files and binary data)
await this.mutation.trigger({ body: form({ file: myFile, name: "photo" }) });

// URL-encoded - application/x-www-form-urlencoded
await this.mutation.trigger({ body: urlencoded({ username: "john", password: "secret" }) });
```

## Core Inject Functions

### injectRead

Fetch data with automatic caching and state management using signals.

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

**Returns Signals:**
- `data: Signal<TData | undefined>` - Response data signal
- `loading: Signal<boolean>` - True during initial fetch
- `fetching: Signal<boolean>` - True during any fetch
- `error: Signal<TError | undefined>` - Error signal if failed
- `trigger(): Promise<Response>` - Manually refetch
- `abort(): void` - Cancel in-flight request
- `meta: Signal<PluginResults>` - Plugin metadata signal

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

Perform mutations (POST, PUT, DELETE) with signals.

**Signature:**
```typescript
const result = injectWrite(
  (api) => api("path").POST(),  // HTTP method selector
  hookOptions?                   // Optional hook-level options
);
```

**Returns Signals:**
- `trigger(options): Promise<Response>` - Execute mutation
- `loading: Signal<boolean>` - Mutation in progress
- `error: Signal<TError | undefined>` - Error signal if failed
- `data: Signal<TData | undefined>` - Response data signal
- `abort(): void` - Cancel request

**Hook Options (second argument):**

*Core Options:*
- `tags?: string[] | "all" | "self" | "none"` - Cache tag configuration

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

### injectPages

Bidirectional pagination with infinite scroll using signals.

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

**Returns Signals:**
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

## Angular-Specific Features

### Signal-Based Enabled Option

```typescript
@Component({...})
export class UserListComponent {
  userId = signal<string | null>(null);

  // Using Signal directly
  user = injectRead(
    (api) => api("users/:id").GET({ params: { id: this.userId()! } }),
    { enabled: () => !!this.userId() }
  );

  // Or using a computed signal
  isEnabled = computed(() => !!this.userId());
  userData = injectRead(
    (api) => api("users/:id").GET({ params: { id: this.userId()! } }),
    { enabled: this.isEnabled }
  );
}
```

### Using in Templates

```html
@if (users.loading()) {
  <app-skeleton />
} @else if (users.error()) {
  <app-error [error]="users.error()!" (retry)="users.trigger()" />
} @else if (!users.data()?.length) {
  <app-empty-state />
} @else {
  <ul>
    @for (user of users.data(); track user.id) {
      <app-user-card [user]="user" />
    }
  </ul>
}
```

### Signal Effects

```typescript
@Component({...})
export class NotificationComponent {
  notifications = injectRead(
    (api) => api("notifications").GET(),
    { pollingInterval: 30000 }
  );

  constructor() {
    effect(() => {
      const data = this.notifications.data();
      if (data?.some(n => n.unread)) {
        this.playNotificationSound();
      }
    });
  }
}
```

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
users = injectRead(
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

### Invalidation in Mutations

```typescript
createUser = injectWrite((api) => api("users").POST());

async handleCreate(userData: CreateUserBody) {
  const result = await this.createUser.trigger({
    body: userData,
    invalidate: "all"  // or "self", "none", "*", ["users"]
  });
}
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
- **`references/signals-api.md`** - Complete signal-based API
- **`references/plugins-api.md`** - All plugins with full configuration

### Examples

For working code examples, see the Spoosh repository examples.
