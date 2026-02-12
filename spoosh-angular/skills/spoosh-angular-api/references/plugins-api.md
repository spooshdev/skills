# Spoosh Plugins API Reference (Angular)

## Plugin Installation

```bash
# Core plugins
pnpm add @spoosh/plugin-cache
pnpm add @spoosh/plugin-retry
pnpm add @spoosh/plugin-polling
pnpm add @spoosh/plugin-debounce
pnpm add @spoosh/plugin-throttle
pnpm add @spoosh/plugin-deduplication
pnpm add @spoosh/plugin-invalidation
pnpm add @spoosh/plugin-optimistic
pnpm add @spoosh/plugin-initial-data
pnpm add @spoosh/plugin-refetch
pnpm add @spoosh/plugin-prefetch
pnpm add @spoosh/plugin-transform
pnpm add @spoosh/plugin-gc
pnpm add @spoosh/plugin-qs
pnpm add @spoosh/plugin-progress
pnpm add @spoosh/plugin-debug
```

## Accessing Plugin Instance APIs

Plugin instance APIs are returned from `create()`, NOT from the Spoosh instance:

```typescript
import { Spoosh } from "@spoosh/core";
import { create } from "@spoosh/angular";
import { cachePlugin } from "@spoosh/plugin-cache";
import { invalidationPlugin } from "@spoosh/plugin-invalidation";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([cachePlugin(), invalidationPlugin()]);

// Instance APIs come from create(), not from spoosh
export const { injectRead, injectWrite, injectInfiniteRead, clearCache, invalidate } = create(spoosh);

// Now you can use instance APIs directly
clearCache();
invalidate(["users"]);
```

## Cache Plugin

Caches responses with configurable stale time.

**Plugin Config:**
```typescript
cachePlugin({
  staleTime?: number;  // Default stale time in ms. Defaults to 0.
})
```

**Per-Request Options:**
```typescript
users = injectRead((api) => api("users").GET(), {
  staleTime: 60000
});
```

**Write Options:**
```typescript
createUser = injectWrite((api) => api("users").POST());

async handleCreate() {
  await this.createUser.trigger({
    body: data,
    clearCache: true
  });
}
```

**Instance API:**
```typescript
const { clearCache } = create(spoosh);

clearCache();
clearCache({ refetchAll: true });
```

## Retry Plugin

Automatic retry with exponential backoff.

**Plugin Config:**
```typescript
retryPlugin({
  retries?: number | false;     // Number of retry attempts. Defaults to 3.
  retryDelay?: number;          // Delay between retries in ms. Defaults to 1000.
  shouldRetry?: ShouldRetryCallback;  // Custom retry logic
})
```

**ShouldRetryCallback:**
```typescript
type ShouldRetryCallback = (context: ShouldRetryContext) => boolean;

interface ShouldRetryContext {
  status?: number;     // HTTP status code
  error: unknown;      // The error that occurred
  attempt: number;     // Current attempt (0-indexed)
  maxRetries: number;  // Max retries configured
}
```

**Default Behavior:**
- Retries on status codes: 408, 429, 500, 502, 503, 504
- Network errors (TypeError) are ALWAYS retried regardless of shouldRetry
- Abort errors are NEVER retried
- Uses exponential backoff: `retryDelay * 2^attempt`

**Per-Request Options:**
```typescript
data = injectRead((api) => api("users").GET(), {
  retries: 5,
  retryDelay: 2000,
  shouldRetry: ({ status, attempt }) => {
    if (status === 401) return false;
    return status !== undefined && status >= 500;
  }
});

// Disable retries
data = injectRead((api) => api("users").GET(), { retries: false });
```

## Polling Plugin

Auto-refresh at intervals.

```typescript
import { pollingPlugin } from "@spoosh/plugin-polling";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([pollingPlugin()]);

// Static interval
status = injectRead((api) => api("status").GET(), { pollingInterval: 5000 });

// Dynamic interval based on response
job = injectRead(
  (api) => api("jobs/:id").GET({ params: { id: this.jobId() } }),
  {
    pollingInterval: (data, error) => {
      if (error) return false;
      if (data?.status === "complete") return false;
      return 2000;
    }
  }
);
```

## Debounce Plugin

Debounce requests (useful for search inputs).

```typescript
import { debouncePlugin } from "@spoosh/plugin-debounce";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([debouncePlugin()]);

// In component
searchTerm = signal('');

searchResults = injectRead(
  (api) => api("search").GET({ query: { q: this.searchTerm() } }),
  { debounce: 300, enabled: () => this.searchTerm().length > 0 }
);
```

## Throttle Plugin

Rate-limit requests.

```typescript
import { throttlePlugin } from "@spoosh/plugin-throttle";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([throttlePlugin()]);

data = injectRead((api) => api("expensive").GET(), { throttle: 1000 });
```

## Deduplication Plugin

Prevent duplicate in-flight requests.

```typescript
import { deduplicationPlugin } from "@spoosh/plugin-deduplication";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([deduplicationPlugin()]);

// Multiple components calling same endpoint share the same request
// Automatic - no configuration needed
```

## Invalidation Plugin

Auto-invalidate cache after mutations.

**Plugin Config:**
```typescript
invalidationPlugin({
  defaultMode?: "all" | "self" | "none";  // Default: "all"
})
```

**Tag Generation (automatic from path):**
- `api("users").GET()` → tags: `["users"]`
- `api("users/:id").GET({ params: { id: "123" } })` → tags: `["users", "users/123"]`
- `api("users/:id/posts").GET(...)` → tags: `["users", "users/123", "users/123/posts"]`

**Write Options:**
```typescript
createUser = injectWrite((api) => api("users").POST());

async handleCreate() {
  await this.createUser.trigger({ body: data, invalidate: "all" });
  await this.createUser.trigger({ body: data, invalidate: "self" });
  await this.createUser.trigger({ body: data, invalidate: "none" });
  await this.createUser.trigger({ body: data, invalidate: "*" });
  await this.createUser.trigger({ body: data, invalidate: ["posts"] });
}
```

**Instance API:**
```typescript
const { invalidate } = create(spoosh);

invalidate("users");
invalidate(["users", "posts"]);
invalidate("*");
```

## Optimistic Plugin

Instant UI updates with automatic rollback using a fluent API.

```typescript
import { optimisticPlugin } from "@spoosh/plugin-optimistic";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([optimisticPlugin()]);

updatePost = injectWrite((api) => api("posts/:id").PUT());

async handleUpdate(postId: string, newTitle: string) {
  // Immediate update - use template literal for dynamic params
  await this.updatePost.trigger({
    params: { id: postId },
    body: { title: newTitle },
    optimistic: (api) => api(`posts/${postId}`)
      .GET()
      .UPDATE_CACHE((current) => ({ ...current, title: newTitle }))
  });

  // Or use WHERE with params filter
  await this.updatePost.trigger({
    params: { id: postId },
    body: { title: newTitle },
    optimistic: (api) => api("posts/:id")
      .GET()
      .WHERE(({ params }) => params.id === postId)
      .UPDATE_CACHE((current) => ({ ...current, title: newTitle }))
  });
}

// With WHERE filter (predicate function)
async handleCreate() {
  await this.createPost.trigger({
    body: this.newPost,
    optimistic: (api) => api("posts")
      .GET()
      .WHERE((entry) => entry.query.page === 1)
      .UPDATE_CACHE((posts) => [this.newPost, ...posts])
  });
}

// Apply after mutation succeeds (receives response)
async handleAdd() {
  await this.addPost.trigger({
    body: postData,
    optimistic: (api) => api("posts")
      .GET()
      .ON_SUCCESS()
      .UPDATE_CACHE((posts, newPost) => [...posts, newPost])
  });
}
```

**Fluent API Methods:**
- `api("path").GET()` - Select cache entries for this path
  - Use template literals for dynamic params: `` api(`posts/${id}`) ``
  - Or use WHERE to filter: `api("posts/:id").GET().WHERE(({ params }) => params.id === id)`
- `.WHERE(predicate)` - Filter cache entries by params/query
  - `({ params }) => params.id === id` - Match by param
  - `({ query }) => query.page === 1` - Match by query
- `.UPDATE_CACHE(fn)` - Update function (required)
- `.ON_SUCCESS()` - Apply after mutation succeeds (response available in UPDATE_CACHE)
- `.NO_ROLLBACK()` - Disable automatic rollback on error
- `.ON_ERROR(fn)` - Callback when mutation fails

**Read Result Properties:**
- `meta().isOptimistic: boolean` - True if data is from an optimistic update (not yet confirmed by server)

## Initial Data Plugin

Show data immediately before fetch completes.

```typescript
import { initialDataPlugin } from "@spoosh/plugin-initial-data";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([initialDataPlugin()]);

// Static initial data
users = injectRead((api) => api("users").GET(), {
  initialData: []
});

// Dynamic initial data
user = injectRead(
  (api) => api("user/:id").GET({ params: { id: this.userId() } }),
  { initialData: () => this.cachedUsers().find(u => u.id === this.userId()) }
);

// Disable background refetch (show initial data only)
users = injectRead((api) => api("users").GET(), {
  initialData: this.cachedData,
  refetchOnInitialData: false  // Default: true
});
```

**Per-Request Options:**
- `initialData?: TData | (() => TData)` - Data to show immediately
- `refetchOnInitialData?: boolean` - Refetch fresh data after showing initial data (default: true)

**Result Properties:**
- `meta().isInitialData: boolean` - True if currently showing initial data (not yet fetched from server)

## Refetch Plugin

Refetch on window focus or network reconnect.

```typescript
import { refetchPlugin } from "@spoosh/plugin-refetch";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([refetchPlugin({
    refetchOnFocus: true,
    refetchOnReconnect: true
  })]);

// Per-request override
users = injectRead((api) => api("users").GET(), {
  refetchOnFocus: false
});
```

## Prefetch Plugin

Preload data before it's needed.

```typescript
import { prefetchPlugin } from "@spoosh/plugin-prefetch";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([prefetchPlugin()]);

// Get prefetch from create()
export const { injectRead, prefetch } = create(spoosh);

// In component
onUserHover(userId: string) {
  prefetch((api) => api("users/:id").GET({ params: { id: userId } }));
}
```

## Transform Plugin

Transform response data.

```typescript
import { transformPlugin } from "@spoosh/plugin-transform";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([transformPlugin()]);

// Sync transform
activeUsers = injectRead((api) => api("users").GET(), {
  transform: (users) => users.filter(u => u.active)
});

// Async transform
data = injectRead((api) => api("data").GET(), {
  transform: async (data) => {
    const enriched = await enrichData(data);
    return enriched;
  }
});

// Transform on write (with hook-level option)
createPost = injectWrite((api) => api("posts").POST(), {
  transform: (post) => ({ ...post, createdAt: new Date(post.timestamp) })
});

// Access transformed data via meta signal
async handleCreate() {
  await this.createPost.trigger({ body: postData });
  console.log(this.createPost.meta().transformedData);
}
```

**Result Properties:**
- `meta().transformedData: TTransformed | undefined` - The transformed response data (available after request completes)

## GC Plugin

Garbage collection for cache entries.

**Plugin Config:**
```typescript
import { gcPlugin } from "@spoosh/plugin-gc";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([gcPlugin({
    maxAge: 300000,      // Max age in ms before entries are removed
    maxEntries: 100,     // Max number of cache entries to keep
    interval: 60000      // Interval between GC runs (default: 60000)
  })]);
```

**Note:** GC plugin has NO per-request options. Configure at plugin level only.

## Query String Plugin

Custom query string serialization using [qs](https://github.com/ljharb/qs) library options.

**Plugin Config:**
```typescript
import { qsPlugin } from "@spoosh/plugin-qs";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([qsPlugin({
    arrayFormat: "brackets",  // "brackets" | "indices" | "repeat" | "comma"
    allowDots: false,         // Enable dot notation: a.b=c
    skipNulls: true           // Skip null values
  })]);
```

**Per-Request Options:**
```typescript
users = injectRead((api) => api("search").GET({ query: { filters: { status: "active" } } }), {
  qs: { arrayFormat: "indices" }  // Override for this request
});
```

**Example:**
```typescript
// Query: { filters: { status: "active", tags: ["a", "b"] } }
// With arrayFormat: "brackets" → filters[status]=active&filters[tags][]=a&filters[tags][]=b
```

## Progress Plugin

Track upload/download progress. Progress tracking must be explicitly enabled with `{ progress: true }`.

**Important:** Progress only contains `loaded` and `total` - there is no `percentage` property. Calculate it manually.

```typescript
import { progressPlugin } from "@spoosh/plugin-progress";
import { form } from "@spoosh/core";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([progressPlugin()]);

// In component
@Component({
  template: `
    <input type="file" (change)="handleUpload($event)" />

    @if (upload.loading() && progress()) {
      <progress [value]="percentage()" max="100" />
      <span>{{ progress()!.loaded }} / {{ progress()!.total }} bytes ({{ percentage() }}%)</span>
    }
  `
})
export class UploadComponent {
  upload = injectWrite((api) => api("upload").POST());

  // Types flow automatically - no casting needed
  progress = computed(() => this.upload.meta().progress);

  // Calculate percentage manually - no percentage property exists!
  percentage = computed(() => {
    const p = this.progress();
    return p?.total && p.total > 0
      ? Math.round((p.loaded / p.total) * 100)
      : 0;
  });

  async handleUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Use form() for file uploads, enable progress tracking
    await this.upload.trigger({
      body: form({ file }),
      progress: true  // Must enable progress!
    });
  }
}
```

**Progress Options:**
- `progress: true` - Enable progress tracking (forces XHR transport)
- `progress: { totalHeader: "x-custom-header" }` - Use custom header for total size

## Debug Plugin

Debugging utilities.

```typescript
import { debugPlugin } from "@spoosh/plugin-debug";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([debugPlugin({ enabled: !environment.production })]);
```

## Next.js Plugin

Server-side cache revalidation for Next.js App Router.

**Note:** This plugin is designed for Next.js React applications. For Angular SSR, consider using a custom invalidation strategy.

**Step 1: Create a Server Action file:**
```typescript
// app/actions/revalidate.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateCache(tags: string[], paths: string[]) {
  for (const tag of tags) {
    revalidateTag(tag);
  }
  for (const path of paths) {
    revalidatePath(path);
  }
}
```

**Step 2: Configure the plugin:**
```typescript
// lib/spoosh.ts
import { nextjsPlugin } from "@spoosh/plugin-nextjs";
import { revalidateCache } from "@/app/actions/revalidate";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([nextjsPlugin({
    serverRevalidator: revalidateCache,
    skipServerRevalidation: false  // Default: false
  })]);
```

**Trigger Options:**
```typescript
await trigger({
  body: data,
  revalidatePaths: ["/users", "/dashboard"],  // Additional paths to revalidate
  serverRevalidate: true                       // Override plugin default
});
```
