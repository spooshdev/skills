# Advanced Spoosh Angular Patterns

## Dependent Queries

Fetch data that depends on another query's result.

```typescript
@Component({...})
export class UserPostsComponent {
  userId = input.required<string>();

  user = injectRead(
    (api) => api("users/:id").GET({ params: { id: this.userId() } })
  );

  posts = injectRead(
    (api) => api("users/:id/posts").GET({
      params: { id: this.userId() },
      query: { category: this.user.data()?.defaultCategory }
    }),
    { enabled: () => !!this.user.data() }
  );

  isLoading = computed(() => this.user.loading() || this.posts.loading());
}
```

## Parallel Queries

Fetch multiple independent resources simultaneously.

```typescript
@Component({...})
export class DashboardComponent {
  user = injectRead((api) => api("me").GET());
  notifications = injectRead((api) => api("notifications").GET());
  stats = injectRead((api) => api("stats").GET());

  loading = computed(() =>
    this.user.loading() || this.notifications.loading() || this.stats.loading()
  );

  hasError = computed(() =>
    this.user.error() || this.notifications.error() || this.stats.error()
  );
}
```

## Prefetching on Hover

```typescript
// In your spoosh setup file (e.g., lib/spoosh.ts)
import { Spoosh } from "@spoosh/core";
import { create } from "@spoosh/angular";
import { prefetchPlugin } from "@spoosh/plugin-prefetch";

const spoosh = new Spoosh<ApiSchema>("/api")
  .use([prefetchPlugin()]);

// prefetch comes from create(), not from spoosh directly
export const { injectRead, injectWrite, prefetch } = create(spoosh);

// In your component
import { prefetch } from "@/lib/spoosh";

@Component({
  selector: 'app-user-card',
  template: `
    <a
      [routerLink]="['/users', user().id]"
      (mouseenter)="onMouseEnter()"
    >
      {{ user().name }}
    </a>
  `
})
export class UserCardComponent {
  user = input.required<User>();

  onMouseEnter() {
    prefetch((api) => api("users/:id").GET({ params: { id: this.user().id } }));
    prefetch((api) => api("users/:id/posts").GET({ params: { id: this.user().id } }));
  }
}
```

## Mutation with Rollback

```typescript
@Component({...})
export class EditableTitleComponent {
  item = input.required<Item>();

  title = signal('');
  editing = signal(false);

  updateItem = injectWrite((api) => api("items/:id").PUT());

  constructor() {
    effect(() => {
      this.title.set(this.item().title);
    });
  }

  startEditing() {
    this.editing.set(true);
  }

  async save() {
    const previousTitle = this.item().title;

    const result = await this.updateItem.trigger({
      params: { id: this.item().id },
      body: { title: this.title() },
      optimistic: (cache) => cache(`items/${this.item().id}`)
        .set((current) => ({ ...current, title: this.title() }))
    });

    if (result.error) {
      this.title.set(previousTitle);
      this.showError('Failed to save');
    } else {
      this.editing.set(false);
    }
  }
}
```

## Bidirectional Infinite Scroll

For chat-like interfaces where you can scroll up for older messages.

```typescript
@Component({...})
export class ChatMessagesComponent {
  chatId = input.required<string>();

  messages = injectPages(
    (api) => api("chats/:id/messages").GET({
      params: { id: this.chatId() },
      query: { cursor: null }
    }),
    {
      canFetchNext: ({ lastPage }) => !!lastPage?.data?.nextCursor,
      nextPageRequest: ({ lastPage }) => ({
        query: { cursor: lastPage?.data?.nextCursor }
      }),
      canFetchPrev: ({ firstPage }) => !!firstPage?.data?.prevCursor,
      prevPageRequest: ({ firstPage }) => ({
        query: { cursor: firstPage?.data?.prevCursor }
      }),
      merger: (pages) => pages.flatMap(p => p.data?.messages ?? [])
    }
  );

  containerRef = viewChild<ElementRef>('container');

  handleScroll(event: Event) {
    const el = event.target as HTMLElement;

    if (el.scrollTop === 0 && this.messages.canFetchPrev() && !this.messages.fetchingPrev()) {
      this.messages.fetchPrev();
    }

    if (el.scrollHeight - el.scrollTop === el.clientHeight &&
        this.messages.canFetchNext() && !this.messages.fetchingNext()) {
      this.messages.fetchNext();
    }
  }
}
```

## Real-time Updates with Polling + Invalidation

```typescript
@Component({...})
export class LiveDashboardComponent {
  stats = injectRead(
    (api) => api("stats").GET(),
    { pollingInterval: 30000 }
  );

  refreshStats = injectWrite((api) => api("stats/refresh").POST());

  async manualRefresh() {
    await this.refreshStats.trigger({ invalidate: ["stats"] });
  }
}
```

## File Upload with Progress

Use the `form()` utility from `@spoosh/core` for file uploads. Progress must be explicitly enabled with `{ progress: true }`.

**Important:** There is no `percentage` property in progress - only `loaded` and `total`. Calculate percentage manually.

```typescript
import { form } from "@spoosh/core";

@Component({
  template: `
    <input type="file" (change)="handleUpload($event)" />

    @if (upload.loading() && progress()) {
      <progress [value]="percentage()" max="100" />
      <span>{{ progress()!.loaded }} / {{ progress()!.total }} bytes ({{ percentage() }}%)</span>
    }
  `
})
export class FileUploaderComponent {
  upload = injectWrite((api) => api("files").POST());

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

    // Use form() utility for proper Content-Type handling
    await this.upload.trigger({
      body: form({ file }),
      progress: true  // Must enable progress tracking!
    });
  }
}
```

**Body Utilities from `@spoosh/core`:**
- `form(data)` - For `multipart/form-data` (supports files and binary data)
- `json(data)` - For `application/json` (default for plain objects)
- `urlencoded(data)` - For `application/x-www-form-urlencoded`

## Custom Inject Function Composition

```typescript
// In a shared service or utility file
export function injectUser(userId: () => string) {
  return injectRead(
    (api) => api("users/:id").GET({ params: { id: userId() } }),
    { staleTime: 60000 }
  );
}

export function injectUserPosts(userId: () => string, enabled: () => boolean = () => true) {
  return injectRead(
    (api) => api("users/:id/posts").GET({ params: { id: userId() } }),
    { enabled, staleTime: 30000 }
  );
}

export function useUpdateUser() {
  return injectWrite((api) => api("users/:id").PUT());
}

// Usage in component
@Component({...})
export class UserProfileComponent {
  userId = input.required<string>();

  user = injectUser(() => this.userId());
  posts = injectUserPosts(() => this.userId(), () => !!this.user.data());
  updateUser = useUpdateUser();
}
```

## Effect for Side Effects

```typescript
@Component({...})
export class NotificationWatcherComponent {
  notifications = injectRead(
    (api) => api("notifications").GET(),
    { pollingInterval: 30000 }
  );

  constructor(private snackBar: MatSnackBar) {
    effect(() => {
      const data = this.notifications.data();
      const newUnread = data?.filter(n => n.unread && n.isNew);

      if (newUnread?.length) {
        this.snackBar.open(`${newUnread.length} new notifications`, 'View');
      }
    });
  }
}
```

## Abort on Component Destroy

Spoosh automatically handles request cancellation on component destroy, but you can also manually abort:

```typescript
@Component({...})
export class SearchWithCancelComponent {
  query = signal('');

  search = injectRead(
    (api) => api("search").GET({ query: { q: this.query() } }),
    { enabled: false }
  );

  async performSearch() {
    this.search.abort();
    await this.search.trigger();
  }

  cancel() {
    this.search.abort();
  }
}
```

## Error Retry with Backoff

```typescript
@Component({...})
export class ResilientDataComponent {
  data = injectRead(
    (api) => api("flaky-endpoint").GET(),
    {
      retry: {
        retries: 5,
        delay: 1000,
        // shouldRetry receives a context object, not a response
        shouldRetry: ({ status, error, attempt, maxRetries }) => {
          if (status === 401) return false;
          if (status === 403) return false;
          if (status === 404) return false;
          return status !== undefined && status >= 500;
        }
      }
    }
  );
}
```

## Using with RxJS (Interop)

```typescript
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Component({...})
export class RxjsInteropComponent {
  users = injectRead((api) => api("users").GET());

  // Convert signal to observable
  users$ = toObservable(this.users.data);

  // Use with RxJS operators
  activeUsers$ = this.users$.pipe(
    filter((users): users is User[] => !!users),
    map(users => users.filter(u => u.active))
  );

  // Convert back to signal if needed
  activeUsers = toSignal(this.activeUsers$);
}
```
