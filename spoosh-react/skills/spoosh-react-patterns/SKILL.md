---
name: Spoosh React Patterns
description: This skill should be used when the user asks about "Spoosh component patterns", "data fetching component", "mutation component", "infinite scroll", "pagination", "optimistic updates", "error handling", "loading states", "Spoosh best practices", or needs guidance on building React components with Spoosh. Provides component patterns and best practices.
---

# Spoosh React Component Patterns

This skill provides best practices and patterns for building React components with Spoosh.

## Data Fetching Component Pattern

### Basic Data Fetching

```typescript
import { useRead } from "@/lib/spoosh";

interface UserListProps {
  enabled?: boolean;
}

export function UserList({ enabled = true }: UserListProps) {
  const { data, loading, error, trigger } = useRead(
    (api) => api("users").GET(),
    { enabled, staleTime: 30000 }
  );

  if (loading) return <UserListSkeleton />;

  if (error) return <ErrorMessage error={error} onRetry={trigger} />;

  if (!data?.length) return <EmptyState message="No users found" />;

  return (
    <ul>
      {data.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </ul>
  );
}
```

### Conditional Fetching

```typescript
export function UserDetails({ userId }: { userId: string | null }) {
  const { data, loading, error } = useRead(
    (api) => api("users/:id").GET({ params: { id: userId! } }),
    { enabled: !!userId }
  );

  if (!userId) return <SelectUserPrompt />;

  if (loading) return <UserDetailsSkeleton />;

  if (error) return <ErrorMessage error={error} />;

  return <UserProfile user={data} />;
}
```

## Mutation Component Pattern

### Form with Mutation

```typescript
import { useWrite } from "@/lib/spoosh";
import { useState } from "react";

export function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { trigger, loading, error } = useWrite((api) => api("users").POST());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await trigger({
      body: { name, email },
      invalidate: "all"
    });

    if (result.data) {
      setName("");
      setEmail("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        disabled={loading}
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        disabled={loading}
      />

      {error && <p className="error">{error.message}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

### Delete with Confirmation

```typescript
export function DeleteUserButton({ userId, onDeleted }: Props) {
  const { trigger, loading } = useWrite(
    (api) => api("users/:id").DELETE()
  );

  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;

    const result = await trigger({
      params: { id: userId },
      invalidate: "all"
    });

    if (result.data) {
      onDeleted?.();
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
```

## Infinite Scroll Pattern

### Basic Infinite Scroll

```typescript
import { usePages } from "@/lib/spoosh";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

export function InfinitePostList() {
  const { ref, inView } = useInView();

  const {
    data,
    loading,
    fetchingNext,
    canFetchNext,
    fetchNext,
    error
  } = usePages(
    (api) => api("posts").GET({ query: { page: 1, limit: 20 } }),
    {
      canFetchNext: ({ lastPage }) => lastPage?.data?.hasMore ?? false,
      nextPageRequest: ({ lastPage, request }) => ({
        query: { ...request.query, page: (lastPage?.data?.page ?? 0) + 1 }
      }),
      merger: (pages) => pages.flatMap((p) => p.data?.items ?? [])
    }
  );

  useEffect(() => {
    if (inView && canFetchNext && !fetchingNext) {
      fetchNext();
    }
  }, [inView, canFetchNext, fetchingNext, fetchNext]);

  if (loading) return <PostListSkeleton />;

  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={ref}>
        {fetchingNext && <LoadingSpinner />}
      </div>
    </div>
  );
}
```

## Search with Debounce Pattern

```typescript
import { useRead } from "@/lib/spoosh";
import { useState } from "react";

export function SearchUsers() {
  const [query, setQuery] = useState("");

  const { data, fetching } = useRead(
    (api) => api("users/search").GET({ query: { q: query } }),
    {
      enabled: query.length >= 2,
      debounce: 300
    }
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
      />

      {fetching && <LoadingIndicator />}

      {data && (
        <ul>
          {data.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Optimistic Updates Pattern

```typescript
export function ToggleLikeButton({ postId, liked, likeCount }: Props) {
  const { trigger, loading } = useWrite((api) => api("posts/:id/like").POST());

  const handleToggle = async () => {
    await trigger({
      params: { id: postId },
      optimistic: (cache) => cache(`posts/${postId}`)
        .set((current) => ({
          ...current,
          liked: !liked,
          likeCount: liked ? likeCount - 1 : likeCount + 1
        }))
    });
  };

  return (
    <button onClick={handleToggle} disabled={loading}>
      {liked ? "Unlike" : "Like"} ({likeCount})
    </button>
  );
}
```

## Polling Pattern

```typescript
export function JobStatus({ jobId }: { jobId: string }) {
  const { data, loading, error } = useRead(
    (api) => api("jobs/:id").GET({ params: { id: jobId } }),
    {
      pollingInterval: ({ data, error }) => {
        if (error) return false;
        if (data?.status === "completed") return false;
        if (data?.status === "failed") return false;
        return 2000;
      }
    }
  );

  if (loading) return <p>Loading job status...</p>;

  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <p>Status: {data?.status}</p>
      {data?.status === "processing" && <ProgressBar value={data.progress} />}
    </div>
  );
}
```

## Error Boundary Pattern

```typescript
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: Props) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function SafeUserList() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <UserList />
    </ErrorBoundary>
  );
}
```

## Additional Resources

### Reference Files

For more patterns and examples, consult:
- **`references/advanced-patterns.md`** - Complex patterns and edge cases
- **`examples/`** - Complete component examples

### Repository Examples

See the Spoosh repository for full examples:
- `examples/react-basic` - Basic usage patterns
- `examples/react-ecommerce` - E-commerce application
