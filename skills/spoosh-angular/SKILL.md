---
name: spoosh-angular
description: Use this skill when the user asks about "Spoosh", "injectRead", "injectWrite", "injectPages", "injectQueue", "Spoosh Angular", "Spoosh injects", "Spoosh plugins", "cache plugin", "retry plugin", "polling plugin", "optimistic updates", "invalidation", "data fetching component", "mutation component", "infinite scroll", "Spoosh patterns", or needs to build Angular components with type-safe API calls. Provides comprehensive API knowledge and component patterns for @spoosh/angular.
---

# Spoosh Angular

Spoosh is a type-safe API toolkit with a composable plugin architecture for TypeScript. This skill covers the Angular integration using signals including inject functions API, plugins, and component patterns.

## Setup

```bash
pnpm add @spoosh/core @spoosh/angular
```

```typescript
import { Spoosh } from "@spoosh/core";
import { create } from "@spoosh/angular";

type ApiSchema = {
  "users": {
    GET: { data: User[] };
    POST: { data: User; body: CreateUserBody };
  };
  "users/:id": {
    GET: { data: User };
    DELETE: { data: void };
  };
};

const spoosh = new Spoosh<ApiSchema, Error>("/api")
  .use([cachePlugin(), retryPlugin()]);

export const { injectRead, injectWrite, injectPages, injectQueue } = create(spoosh);
```

## Inject Functions API

### injectRead

Fetch data with automatic caching and state management. Returns signals.

```typescript
const users = injectRead(
  (api) => api("users").GET(),
  { staleTime: 30000, enabled: true }
);
```

**Returns (all signals except methods):** `data`, `loading`, `fetching`, `error`, `trigger()`, `abort()`, `meta`

**Options:** `enabled` (supports Signal or function), `tags`, `staleTime`, `retry`, `pollingInterval`, `refetch`, `debounce`, `transform`, `initialData`

### injectWrite

Perform mutations (POST, PUT, DELETE). Returns signals.

```typescript
const createUser = injectWrite((api) => api("users").POST());

await createUser.trigger({
  body: { name, email },
  invalidate: "all"
});
```

**Returns (all signals except methods):** `trigger()`, `loading`, `error`, `data`, `meta`, `input`, `abort()`

**Trigger options:** `body`, `params`, `query`, `headers`, `invalidate`, `clearCache`, `optimistic`

### injectPages

Bidirectional pagination with infinite scroll. Returns signals.

```typescript
const posts = injectPages(
  (api) => api("posts").GET({ query: { page: 1 } }),
  {
    canFetchNext: ({ lastPage }) => lastPage?.data?.hasMore ?? false,
    nextPageRequest: ({ lastPage, request }) => ({
      query: { ...request.query, page: (lastPage?.data?.page ?? 0) + 1 }
    }),
    merger: (pages) => pages.flatMap(p => p.data?.items ?? [])
  }
);
```

**Returns (all signals except methods):** `data`, `pages`, `loading`, `fetchingNext`, `canFetchNext`, `fetchNext()`, `fetchPrev()`, `trigger()`

### injectQueue

Queue management for batch operations with concurrency control.

```typescript
const uploadQueue = injectQueue(
  (api) => api("files").POST(),
  { concurrency: 3 }
);

files.forEach(file => uploadQueue.trigger({ body: form({ file }) }));
```

**Returns (signals for tasks and stats):** `tasks`, `stats`, `trigger()`, `abort()`, `retry()`, `remove()`, `removeSettled()`, `clear()`, `setConcurrency()`

**Stats:** `pending`, `loading`, `settled`, `success`, `failed`, `total`, `percentage`

## Plugins

| Plugin | Purpose | Key Options |
|--------|---------|-------------|
| `cachePlugin` | Response caching | `staleTime` |
| `retryPlugin` | Automatic retries | `retry: { retries, delay }` |
| `pollingPlugin` | Auto-refresh | `pollingInterval` |
| `invalidationPlugin` | Cache invalidation | `invalidate` |
| `optimisticPlugin` | Instant UI updates | `optimistic` |
| `debouncePlugin` | Debounce requests | `debounce` |
| `refetchPlugin` | Refetch on focus | `refetch: { onFocus, onReconnect }` |

## Cache Invalidation

```typescript
// After mutation
await createUser.trigger({ body: data, invalidate: "all" });    // Invalidate hierarchy
await createUser.trigger({ body: data, invalidate: "self" });   // Exact path only
await createUser.trigger({ body: data, invalidate: ["users"] }); // Specific tags
```

## Component Patterns

### Data Fetching

```typescript
@Component({
  selector: "app-user-list",
  template: `
    @if (users.loading()) {
      <app-user-list-skeleton />
    } @else if (users.error()) {
      <app-error-message [error]="users.error()!" (retry)="users.trigger()" />
    } @else if (!users.data()?.length) {
      <app-empty-state message="No users found" />
    } @else {
      <ul>
        @for (user of users.data(); track user.id) {
          <app-user-card [user]="user" />
        }
      </ul>
    }
  `,
})
export class UserListComponent {
  users = injectRead((api) => api("users").GET(), { staleTime: 30000 });
}
```

### Mutation Form

```typescript
@Component({
  selector: "app-create-user-form",
  template: `
    <form (ngSubmit)="handleSubmit()">
      <input [(ngModel)]="name" name="name" [disabled]="createUser.loading()" />
      @if (createUser.error()) {
        <p class="error">{{ createUser.error()!.message }}</p>
      }
      <button [disabled]="createUser.loading()">
        {{ createUser.loading() ? "Creating..." : "Create" }}
      </button>
    </form>
  `,
})
export class CreateUserFormComponent {
  name = "";
  createUser = injectWrite((api) => api("users").POST());

  async handleSubmit() {
    const result = await this.createUser.trigger({
      body: { name: this.name },
      invalidate: "all",
    });
    if (result.data) this.name = "";
  }
}
```

### Infinite Scroll

```typescript
@Component({
  selector: "app-infinite-post-list",
  template: `
    @if (posts.loading()) {
      <app-post-list-skeleton />
    } @else {
      <div>
        @for (post of posts.data(); track post.id) {
          <app-post-card [post]="post" />
        }
        <div #loadTrigger>
          @if (posts.fetchingNext()) {
            <app-loading-spinner />
          }
        </div>
      </div>
    }
  `,
})
export class InfinitePostListComponent {
  loadTrigger = viewChild<ElementRef>("loadTrigger");

  posts = injectPages(
    (api) => api("posts").GET({ query: { page: 1, limit: 20 } }),
    {
      canFetchNext: ({ lastPage }) => lastPage?.data?.hasMore ?? false,
      nextPageRequest: ({ lastPage, request }) => ({
        query: { ...request.query, page: (lastPage?.data?.page ?? 0) + 1 },
      }),
      merger: (pages) => pages.flatMap((p) => p.data?.items ?? []),
    }
  );

  private observer?: IntersectionObserver;

  constructor() {
    effect(() => {
      const element = this.loadTrigger()?.nativeElement;
      if (element) {
        this.observer?.disconnect();
        this.observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && this.posts.canFetchNext() && !this.posts.fetchingNext()) {
              this.posts.fetchNext();
            }
          },
          { threshold: 0.1 }
        );
        this.observer.observe(element);
      }
    });
  }
}
```

### Optimistic Updates

```typescript
@Component({
  selector: "app-toggle-like-button",
  template: `
    <button (click)="handleToggle()">{{ liked() ? "Unlike" : "Like" }} ({{ likeCount() }})</button>
  `,
})
export class ToggleLikeButtonComponent {
  postId = input.required<string>();
  liked = input.required<boolean>();
  likeCount = input.required<number>();

  toggleLike = injectWrite((api) => api("posts/:id/like").POST());

  handleToggle() {
    this.toggleLike.trigger({
      params: { id: this.postId() },
      optimistic: (cache) => cache(`posts/${this.postId()}`)
        .set((current) => ({
          ...current,
          liked: !this.liked(),
          likeCount: this.liked() ? this.likeCount() - 1 : this.likeCount() + 1,
        }))
    });
  }
}
```

### Search with Debounce

```typescript
@Component({
  selector: "app-search-users",
  template: `
    <div>
      <input [(ngModel)]="query" (ngModelChange)="searchQuery.set($event)" placeholder="Search..." />
      @if (searchResults.fetching()) {
        <app-loading-indicator />
      }
      @for (user of searchResults.data(); track user.id) {
        <li>{{ user.name }}</li>
      }
    </div>
  `,
})
export class SearchUsersComponent {
  query = "";
  searchQuery = signal("");

  searchResults = injectRead(
    (api) => api("users/search").GET({ query: { q: this.searchQuery() } }),
    { enabled: () => this.searchQuery().length >= 2, debounce: 300 }
  );
}
```

### Polling

```typescript
@Component({
  selector: "app-job-status",
  template: `<p>Status: {{ job.data()?.status }}</p>`,
})
export class JobStatusComponent {
  jobId = input.required<string>();

  job = injectRead(
    (api) => api("jobs/:id").GET({ params: { id: this.jobId() } }),
    {
      pollingInterval: ({ data }) => {
        if (data?.status === "completed" || data?.status === "failed") return false;
        return 2000;
      }
    }
  );
}
```

## Server Type Inference

### Hono

```typescript
import { Spoosh, StripPrefix } from "@spoosh/core";
import type { HonoToSpoosh } from "@spoosh/hono";

// Server: app.basePath("/api")
type FullSchema = HonoToSpoosh<typeof app>;
type ApiSchema = StripPrefix<FullSchema, "api">; // Avoid double /api/api

const spoosh = new Spoosh<ApiSchema, Error>("/api");
```

### Elysia

```typescript
import { Spoosh, StripPrefix } from "@spoosh/core";
import type { ElysiaToSpoosh } from "@spoosh/elysia";

// Server: new Elysia({ prefix: "/api" })
type FullSchema = ElysiaToSpoosh<typeof app>;
type ApiSchema = StripPrefix<FullSchema, "api">; // Avoid double /api/api

const spoosh = new Spoosh<ApiSchema, Error>("/api");
```

Use `StripPrefix` when your baseUrl includes the same prefix as the server's basePath to prevent double prefixing (e.g., `/api/api/users`).

## OpenAPI

```bash
# Export TypeScript → OpenAPI
npx spoosh-openapi export --schema ./schema.ts --output openapi.json

# Import OpenAPI → TypeScript
npx spoosh-openapi import openapi.json --output ./schema.ts
```

## References

For detailed API documentation:
- `references/signals-api.md` - Complete inject function signatures
- `references/plugins-api.md` - All plugin configurations
