---
name: Spoosh Angular Patterns
description: This skill should be used when the user asks about "Spoosh component patterns", "data fetching component", "Angular signals with Spoosh", "infinite scroll", "pagination", "optimistic updates", "error handling", "loading states", "Spoosh best practices", or needs guidance on building Angular components with Spoosh. Provides component patterns and best practices.
---

# Spoosh Angular Component Patterns

This skill provides best practices and patterns for building Angular components with Spoosh using signals.

## Data Fetching Component Pattern

### Basic Data Fetching

```typescript
import { Component, computed } from "@angular/core";
import { injectRead } from "@/lib/spoosh";

@Component({
  selector: "app-user-list",
  template: `
    @if (users.loading()) {
      <app-user-list-skeleton />
    } @else if (users.error()) {
      <app-error-message
        [error]="users.error()!"
        (retry)="users.trigger()"
      />
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

  userCount = computed(() => this.users.data()?.length ?? 0);
}
```

### Conditional Fetching with Input

```typescript
import { Component, input, computed } from "@angular/core";
import { injectRead } from "@/lib/spoosh";

@Component({
  selector: "app-user-details",
  template: `
    @if (!userId()) {
      <app-select-user-prompt />
    } @else if (user.loading()) {
      <app-user-details-skeleton />
    } @else if (user.error()) {
      <app-error-message [error]="user.error()!" />
    } @else {
      <app-user-profile [user]="user.data()!" />
    }
  `,
})
export class UserDetailsComponent {
  userId = input<string | null>(null);

  user = injectRead(
    (api) => api("users/:id").GET({ params: { id: this.userId()! } }),
    { enabled: () => !!this.userId() }
  );
}
```

## Mutation Component Pattern

### Form with Mutation

```typescript
import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { injectWrite } from "@/lib/spoosh";

@Component({
  selector: "app-create-user-form",
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="handleSubmit()">
      <input
        [(ngModel)]="name"
        name="name"
        placeholder="Name"
        [disabled]="createUser.loading()"
      />

      <input
        [(ngModel)]="email"
        name="email"
        type="email"
        placeholder="Email"
        [disabled]="createUser.loading()"
      />

      @if (createUser.error()) {
        <p class="error">{{ createUser.error()!.message }}</p>
      }

      <button type="submit" [disabled]="createUser.loading()">
        {{ createUser.loading() ? "Creating..." : "Create User" }}
      </button>
    </form>
  `,
})
export class CreateUserFormComponent {
  name = "";
  email = "";

  createUser = injectWrite((api) => api("users").POST());

  async handleSubmit() {
    const result = await this.createUser.trigger({
      body: { name: this.name, email: this.email },
      invalidate: "all",
    });

    if (result.data) {
      this.name = "";
      this.email = "";
    }
  }
}
```

### Delete with Confirmation

```typescript
import { Component, input, output } from "@angular/core";
import { injectWrite } from "@/lib/spoosh";

@Component({
  selector: "app-delete-user-button",
  template: `
    <button (click)="handleDelete()" [disabled]="deleteUser.loading()">
      {{ deleteUser.loading() ? "Deleting..." : "Delete" }}
    </button>
  `,
})
export class DeleteUserButtonComponent {
  userId = input.required<string>();
  deleted = output<void>();

  deleteUser = injectWrite((api) => api("users/:id").DELETE());

  async handleDelete() {
    if (!confirm("Are you sure?")) return;

    const result = await this.deleteUser.trigger({
      params: { id: this.userId() },
      invalidate: "all",
    });

    if (result.data) {
      this.deleted.emit();
    }
  }
}
```

## Infinite Scroll Pattern

### Basic Infinite Scroll

```typescript
import { Component, effect, ElementRef, viewChild } from "@angular/core";
import { injectPages } from "@/lib/spoosh";

@Component({
  selector: "app-infinite-post-list",
  template: `
    @if (posts.loading()) {
      <app-post-list-skeleton />
    } @else if (posts.error()) {
      <app-error-message [error]="posts.error()!" />
    } @else {
      <div>
        @for (post of posts.data(); track post.id) {
          <app-post-card [post]="post" />
        }

        <div #loadTrigger class="load-trigger">
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
            if (
              entries[0].isIntersecting &&
              this.posts.canFetchNext() &&
              !this.posts.fetchingNext()
            ) {
              this.posts.fetchNext();
            }
          },
          { threshold: 0.1 }
        );
        this.observer.observe(element);
      }
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
```

## Search with Debounce Pattern

```typescript
import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { injectRead } from "@/lib/spoosh";

@Component({
  selector: "app-search-users",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <input
        [(ngModel)]="query"
        (ngModelChange)="onQueryChange($event)"
        placeholder="Search users..."
      />

      @if (searchResults.fetching()) {
        <app-loading-indicator />
      }

      @if (searchResults.data()) {
        <ul>
          @for (user of searchResults.data(); track user.id) {
            <li>{{ user.name }}</li>
          }
        </ul>
      }
    </div>
  `,
})
export class SearchUsersComponent {
  query = "";
  searchQuery = signal("");

  searchResults = injectRead(
    (api) => api("users/search").GET({ query: { q: this.searchQuery() } }),
    {
      enabled: () => this.searchQuery().length >= 2,
      debounce: 300,
    }
  );

  onQueryChange(value: string) {
    this.searchQuery.set(value);
  }
}
```

## Optimistic Updates Pattern

```typescript
@Component({
  selector: "app-toggle-like-button",
  template: `
    <button (click)="handleToggle()" [disabled]="toggleLike.loading()">
      {{ liked() ? "Unlike" : "Like" }} ({{ likeCount() }})
    </button>
  `,
})
export class ToggleLikeButtonComponent {
  postId = input.required<string>();
  liked = input.required<boolean>();
  likeCount = input.required<number>();

  toggleLike = injectWrite((api) => api("posts/:id/like").POST());

  async handleToggle() {
    await this.toggleLike.trigger({
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

## Polling Pattern

```typescript
@Component({
  selector: "app-job-status",
  template: `
    @if (job.loading()) {
      <p>Loading job status...</p>
    } @else if (job.error()) {
      <app-error-message [error]="job.error()!" />
    } @else {
      <div>
        <p>Status: {{ job.data()?.status }}</p>
        @if (job.data()?.status === "processing") {
          <app-progress-bar [value]="job.data()!.progress" />
        }
      </div>
    }
  `,
})
export class JobStatusComponent {
  jobId = input.required<string>();

  job = injectRead(
    (api) => api("jobs/:id").GET({ params: { id: this.jobId() } }),
    {
      pollingInterval: ({ data, error }) => {
        if (error) return false;
        if (data?.status === "completed") return false;
        if (data?.status === "failed") return false;
        return 2000;
      },
    }
  );
}
```

## Service Pattern

```typescript
import { Injectable, signal, computed } from "@angular/core";
import { injectRead, injectWrite, clearCache } from "@/lib/spoosh";

@Injectable({ providedIn: "root" })
export class UserService {
  private currentUserId = signal<string | null>(null);

  currentUser = injectRead(
    (api) => api("users/:id").GET({ params: { id: this.currentUserId()! } }),
    { enabled: () => !!this.currentUserId() }
  );

  isLoggedIn = computed(() => !!this.currentUser.data());

  setCurrentUser(id: string) {
    this.currentUserId.set(id);
  }

  logout() {
    this.currentUserId.set(null);
    // clearCache comes from create(), not from spoosh.instanceApi
    clearCache();
  }
}
```

## Additional Resources

### Reference Files

For more patterns and examples, consult:
- **`references/advanced-patterns.md`** - Complex patterns and edge cases
- **`examples/`** - Complete component examples

### Repository Examples

See the Spoosh repository for full examples.
