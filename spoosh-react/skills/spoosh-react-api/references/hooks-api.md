# Spoosh React Hooks API Reference

## useRead

### Complete Signature

```typescript
function useRead<TData, TError, TTransformed = TData>(
  requestFn: (api: SpooshApi) => RequestConfig<TData>,
  options?: UseReadOptions<TData, TError, TTransformed>
): UseReadResult<TData, TError, TMeta>;
```

### Core Options

```typescript
type BaseReadOptions = {
  /** Whether to fetch automatically on mount. Default: true */
  enabled?: boolean;

  /**
   * Unified tag option
   * - String: mode only ('all' | 'self' | 'none')
   * - Array: custom tags only OR [mode keyword mixed with custom tags]
   */
  tags?: TagMode | (TagModeInArray | (string & {}))[];
};
```

### Plugin Options (require corresponding plugins)

```typescript
// These options are ONLY available when the corresponding plugin is installed

// Cache plugin (@spoosh/plugin-cache)
staleTime?: number;

// Retry plugin (@spoosh/plugin-retry)
retries?: number | false;
retryDelay?: number;
shouldRetry?: (context: ShouldRetryContext) => boolean;
// ShouldRetryContext: { status?: number; error: unknown; attempt: number; maxRetries: number }

// Polling plugin (@spoosh/plugin-polling)
pollingInterval?: number | ((data: TData | undefined, error: TError | undefined) => number | false);

// Debounce plugin (@spoosh/plugin-debounce)
debounce?: number | ((prevRequest: TRequest) => number);

// Transform plugin (@spoosh/plugin-transform)
transform?: (data: TData) => TTransformed;

// Initial data plugin (@spoosh/plugin-initial-data)
initialData?: TData | (() => TData | undefined);

// Refetch plugin (@spoosh/plugin-refetch)
refetchOnFocus?: boolean;
refetchOnReconnect?: boolean;

// GC plugin (@spoosh/plugin-gc) - NO per-request options
// Configure at plugin level: maxAge, maxEntries, interval

// Progress plugin (@spoosh/plugin-progress)
progress?: boolean | { totalHeader?: string };
```

### Result

```typescript
type BaseReadResult<TData, TError, TMeta> = {
  /** True during the initial load (no data yet) */
  loading: boolean;

  /** True during any fetch operation */
  fetching: boolean;

  /** Response data from the API */
  data: TData | undefined;

  /** Error from the last failed request */
  error: TError | undefined;

  /** Plugin-provided metadata */
  meta: TMeta;

  /** Abort the current fetch operation */
  abort: () => void;

  /** Manually trigger a fetch */
  trigger: (options?: { force?: boolean }) => Promise<SpooshResponse<TData, TError>>;
};
```

## useWrite

### Complete Signature

```typescript
function useWrite<TData, TError, TBody, TTransformed = TData>(
  requestFn: (api: SpooshApi) => WriteMethod<TData, TBody>,
  hookOptions?: UseWriteOptions<TData, TTransformed>
): UseWriteResult<TData, TError, TOptions, TMeta>;
```

**Note:** useWrite accepts hook-level options as a second argument for options that affect type inference (like `transform`).

### Hook Options (second argument)

```typescript
// Plugin hook options (require corresponding plugins)

// Transform plugin (@spoosh/plugin-transform)
transform?: (data: TData) => TTransformed;

// Retry plugin (@spoosh/plugin-retry) - can also be in trigger
retries?: number | false;
retryDelay?: number;
```

### Trigger Options

```typescript
// Core trigger options (always available)
type CoreTriggerOptions<TBody> = {
  body?: TBody;
  params?: Record<string, string | number>;
  query?: Record<string, unknown>;
  headers?: HeadersInit;
};

// Plugin trigger options (require corresponding plugins)

// Cache plugin (@spoosh/plugin-cache)
clearCache?: boolean;

// Invalidation plugin (@spoosh/plugin-invalidation)
invalidate?: "all" | "self" | "none" | "*" | string | string[];

// Optimistic plugin (@spoosh/plugin-optimistic)
optimistic?: (api) => api("path").GET().UPDATE_CACHE(fn);  // Fluent API

// Progress plugin (@spoosh/plugin-progress)
progress?: boolean | { totalHeader?: string };
```

### Result

```typescript
type BaseWriteResult<TData, TError, TOptions, TMeta> = {
  /** Execute the mutation with optional options */
  trigger: (options?: TOptions) => Promise<SpooshResponse<TData, TError>>;

  /** True while the mutation is in progress */
  loading: boolean;

  /** Response data from the API */
  data: TData | undefined;

  /** Error from the last failed request */
  error: TError | undefined;

  /** Plugin-provided metadata */
  meta: TMeta;

  /** The last trigger input (body, params, query) */
  input: { body?: TBody; params?: TParams; query?: TQuery } | undefined;

  /** Abort the current mutation */
  abort: () => void;
};
```

## useInfiniteRead

### Complete Signature

```typescript
function useInfiniteRead<TData, TError, TItem>(
  requestFn: (api: SpooshApi) => RequestConfig<TData>,
  options: UseInfiniteReadOptions<TData, TItem>
): UseInfiniteReadResult<TData, TError, TItem>;
```

### Options

```typescript
type BaseInfiniteReadOptions<TData, TItem, TRequest> = {
  /** Whether to fetch automatically on mount. Default: true */
  enabled?: boolean;

  /** Tag configuration */
  tags?: TagMode | (TagModeInArray | (string & {}))[];

  /** Callback to determine if there's a next page to fetch */
  canFetchNext: (ctx: InfiniteNextContext<TData, TRequest>) => boolean;

  /** Callback to build the request options for the next page */
  nextPageRequest: (ctx: InfiniteNextContext<TData, TRequest>) => Partial<TRequest>;

  /** Callback to merge all responses into a single array of items */
  merger: (allResponses: TData[]) => TItem[];

  /** Callback to determine if there's a previous page to fetch */
  canFetchPrev?: (ctx: InfinitePrevContext<TData, TRequest>) => boolean;

  /** Callback to build the request options for the previous page */
  prevPageRequest?: (ctx: InfinitePrevContext<TData, TRequest>) => Partial<TRequest>;

  // Plus plugin options (same as useRead)
};

type InfiniteNextContext<TData, TRequest> = {
  response: TData | undefined;
  request: TRequest;
  allResponses: TData[];
};

type InfinitePrevContext<TData, TRequest> = {
  response: TData | undefined;
  request: TRequest;
  allResponses: TData[];
};
```

### Result

```typescript
type BaseInfiniteReadResult<TData, TError, TItem, TPluginResult> = {
  /** Merged items from all fetched responses */
  data: TItem[] | undefined;

  /** Array of all raw response data */
  allResponses: TData[] | undefined;

  /** True during the initial load (no data yet) */
  loading: boolean;

  /** True during any fetch operation */
  fetching: boolean;

  /** True while fetching the next page */
  fetchingNext: boolean;

  /** True while fetching the previous page */
  fetchingPrev: boolean;

  /** Whether there's a next page available to fetch */
  canFetchNext: boolean;

  /** Whether there's a previous page available to fetch */
  canFetchPrev: boolean;

  /** Plugin-provided metadata */
  meta: TPluginResult;

  /** Fetch the next page */
  fetchNext: () => Promise<void>;

  /** Fetch the previous page */
  fetchPrev: () => Promise<void>;

  /** Trigger refetch of all pages from the beginning */
  trigger: () => Promise<void>;

  /** Abort the current fetch operation */
  abort: () => void;

  /** Error from the last failed request */
  error: TError | undefined;
};
```

## Response Format

All hooks return responses as a discriminated union:

```typescript
type SpooshResponse<TData, TError> =
  // Success case
  | {
      status: number;
      data: TData;
      headers?: Headers;
      error?: undefined;
      aborted?: false;
      input: { query?: unknown; body?: unknown; params?: Record<string, string> };
    }
  // Error case
  | {
      status: number;
      data?: undefined;
      headers?: Headers;
      error: TError;
      aborted?: boolean;
      input: { query?: unknown; body?: unknown; params?: Record<string, string> };
    };
```

## Plugin Results (meta)

The `meta` field contains plugin-specific results. Types flow automatically from installed plugins through TypeScript type merging.

**Important:** Meta values only appear when the corresponding plugin option is used.

```typescript
// Types are automatically inferred from installed plugins:

// Progress plugin (only when { progress: true } option is passed)
// NOTE: There is NO percentage field - calculate it manually!
meta.progress?: {
  loaded: number;   // Bytes transferred
  total: number;    // Total bytes (0 if unknown)
};

// Initial data plugin (only when initialData option is used)
meta.isInitialData?: boolean;

// Optimistic plugin (only during optimistic updates)
meta.isOptimistic?: boolean;

// Transform plugin (useWrite only) - REQUIRES CASTING
// transformedData is typed as unknown, cast to your expected type
meta.transformedData as YourType;
```

**Example: Accessing progress**
```typescript
const { meta } = useRead(
  (api) => api("file").GET(),
  { progress: true }  // Must enable progress!
);

// Types are inferred - no casting needed
const percentage = meta.progress?.total && meta.progress.total > 0
  ? Math.round((meta.progress.loaded / meta.progress.total) * 100)
  : 0;
```

**Example: Accessing transformedData (with hook-level transform)**
```typescript
const { trigger, meta } = useWrite(
  (api) => api("data").POST(),
  { transform: (response) => response.items.map(normalize) }
);

await trigger({ body: data });

// transformedData is typed based on transform function
const items = meta.transformedData;  // Type: NormalizedItem[]
```
