# Spoosh Angular Signals API Reference

## injectRead

### Complete Signature

```typescript
function injectRead<TData, TError, TTransformed = TData>(
  requestFn: (api: SpooshApi) => RequestConfig<TData>,
  options?: InjectReadOptions<TData, TError, TTransformed>
): InjectReadResult<TTransformed, TError>;
```

### Options

```typescript
interface InjectReadOptions<TData, TError, TTransformed> {
  // ========== CORE OPTIONS (always available) ==========
  // Angular-specific: accepts Signal or callback
  enabled?: boolean | Signal<boolean> | (() => boolean);
  tags?: TagMode | string[];            // Cache tag configuration

  // ========== PLUGIN OPTIONS (require corresponding plugins) ==========

  // Cache plugin (@spoosh/plugin-cache)
  staleTime?: number;

  // Retry plugin (@spoosh/plugin-retry)
  retries?: number | false;
  retryDelay?: number;
  shouldRetry?: (context: ShouldRetryContext) => boolean;
  // ShouldRetryContext: { status?: number; error: unknown; attempt: number; maxRetries: number }

  // Polling plugin (@spoosh/plugin-polling)
  pollingInterval?: number | ((data, error) => number | false);

  // Debounce plugin (@spoosh/plugin-debounce)
  debounce?: number | ((prevRequest: TRequest) => number);

  // Transform plugin (@spoosh/plugin-transform)
  transform?: (data: TData) => TTransformed;

  // Initial data plugin (@spoosh/plugin-initial-data)
  initialData?: TData | (() => TData);

  // Refetch plugin (@spoosh/plugin-refetch)
  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;

  // GC plugin (@spoosh/plugin-gc) - NO per-request options
  // Configure at plugin level: maxAge, maxEntries, interval

  // Progress plugin (@spoosh/plugin-progress)
  progress?: boolean | { totalHeader?: string };
}
```

### Result (All Signals)

```typescript
interface InjectReadResult<TData, TError> {
  data: Signal<TData | undefined>;
  loading: Signal<boolean>;
  fetching: Signal<boolean>;
  error: Signal<TError | undefined>;
  trigger: (options?: { force?: boolean }) => Promise<SpooshResponse<TData, TError>>;
  abort: () => void;
  meta: Signal<PluginResults>;
}
```

## injectWrite

### Complete Signature

```typescript
function injectWrite<TData, TError, TBody>(
  requestFn: (api: SpooshApi) => WriteMethod<TData, TBody>,
  options?: InjectWriteOptions
): InjectWriteResult<TData, TError, TBody>;
```

### Trigger Options

```typescript
interface WriteTriggerOptions<TBody> {
  // ========== CORE OPTIONS (always available) ==========
  body?: TBody;
  params?: Record<string, string>;
  query?: Record<string, any>;
  headers?: Record<string, string>;

  // ========== PLUGIN OPTIONS (require corresponding plugins) ==========

  // Cache plugin (@spoosh/plugin-cache)
  clearCache?: boolean;

  // Invalidation plugin (@spoosh/plugin-invalidation)
  invalidate?: "all" | "self" | "none" | "*" | string | string[];

  // Optimistic plugin (@spoosh/plugin-optimistic)
  optimistic?: (api) => api("path").GET().UPDATE_CACHE(fn);  // Fluent API

  // Retry plugin (@spoosh/plugin-retry)
  retries?: number | false;
  retryDelay?: number;

  // Progress plugin (@spoosh/plugin-progress)
  progress?: boolean | { totalHeader?: string };
}
```

### Result (All Signals)

```typescript
interface InjectWriteResult<TData, TError, TBody> {
  trigger: (options?: WriteTriggerOptions<TBody>) => Promise<SpooshResponse<TData, TError>>;
  loading: Signal<boolean>;
  error: Signal<TError | undefined>;
  data: Signal<TData | undefined>;
  meta: Signal<PluginResults>;
  input: Signal<{ body?: TBody; params?: TParams; query?: TQuery } | undefined>;
  abort: () => void;
}
```

## injectInfiniteRead

### Complete Signature

```typescript
function injectInfiniteRead<TData, TError, TMerged = TData[]>(
  requestFn: (api: SpooshApi) => RequestConfig<TData>,
  options: InjectInfiniteReadOptions<TData, TError, TMerged>
): InjectInfiniteReadResult<TMerged, TData, TError>;
```

### Options

```typescript
interface InjectInfiniteReadOptions<TData, TError, TMerged> {
  // ========== REQUIRED OPTIONS ==========
  canFetchNext: (context: PageContext<TData>) => boolean;
  nextPageRequest: (context: PageContext<TData>) => Partial<RequestOptions>;
  merger: (responses: TData[]) => TMerged;

  // ========== OPTIONAL: Previous page support ==========
  canFetchPrev?: (context: PageContext<TData>) => boolean;
  prevPageRequest?: (context: PageContext<TData>) => Partial<RequestOptions>;

  // ========== CORE OPTIONS (Angular-specific enabled) ==========
  enabled?: boolean | Signal<boolean> | (() => boolean);
  tags?: TagMode | string[];

  // ========== PLUGIN OPTIONS (same as injectRead) ==========
  staleTime?: number;              // Cache plugin
  retries?: number;                // Retry plugin
  pollingInterval?: number;        // Polling plugin
  // ... other plugin options
}

interface PageContext<TData> {
  response: TData | undefined;
  request: RequestOptions;
  allResponses: TData[];
}
```

### Result (All Signals)

```typescript
interface InjectInfiniteReadResult<TMerged, TData, TError> {
  data: Signal<TMerged | undefined>;
  allResponses: Signal<TData[] | undefined>;
  loading: Signal<boolean>;
  fetching: Signal<boolean>;
  fetchingNext: Signal<boolean>;
  fetchingPrev: Signal<boolean>;
  canFetchNext: Signal<boolean>;
  canFetchPrev: Signal<boolean>;
  fetchNext: () => Promise<void>;
  fetchPrev: () => Promise<void>;
  trigger: () => Promise<void>;
  abort: () => void;
  error: Signal<TError | undefined>;
  meta: Signal<PluginResults>;
}
```

## Angular-Specific Patterns

### Using with computed()

```typescript
@Component({...})
export class UserComponent {
  userId = input.required<string>();

  user = injectRead(
    (api) => api("users/:id").GET({ params: { id: this.userId() } }),
    { enabled: () => !!this.userId() }
  );

  // Computed from signal
  userDisplayName = computed(() => {
    const user = this.user.data();
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  });
}
```

### Using with effect()

```typescript
@Component({...})
export class DataSyncComponent {
  data = injectRead((api) => api("data").GET());

  constructor() {
    effect(() => {
      const current = this.data.data();
      if (current) {
        this.syncToLocalStorage(current);
      }
    });
  }
}
```

### Using with model()

```typescript
@Component({...})
export class EditableComponent {
  value = model<string>('');

  saveValue = injectWrite((api) => api("values").POST());

  async save() {
    const result = await this.saveValue.trigger({
      body: { value: this.value() }
    });

    if (result.data) {
      this.value.set(result.data.value);
    }
  }
}
```

### Reactive Enabled with Signals

```typescript
@Component({...})
export class ConditionalFetchComponent {
  // Using input signal
  enabled = input(false);

  // Query only runs when enabled signal is true
  data = injectRead(
    (api) => api("data").GET(),
    { enabled: this.enabled }
  );
}
```

### In Services

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserId = signal<string | null>(null);

  currentUser = injectRead(
    (api) => api("users/:id").GET({ params: { id: this.currentUserId()! } }),
    { enabled: () => !!this.currentUserId() }
  );

  setCurrentUser(id: string) {
    this.currentUserId.set(id);
  }
}
```

## Response Format

All inject functions return responses in this format:

```typescript
interface SpooshResponse<TData, TError> {
  status: number;
  data?: TData;
  error?: TError;
  headers?: Headers;
  aborted?: boolean;
  input: {
    query?: Record<string, any>;
    body?: any;
    params?: Record<string, string>;
  };
}
```

## Plugin Results (meta signal)

The `meta` signal contains plugin-specific results. Types flow automatically from installed plugins through TypeScript type merging.

**Important:** Meta values only appear when the corresponding plugin option is used.

```typescript
// Types are automatically inferred from installed plugins:

// Progress plugin (only when { progress: true } option is passed)
// NOTE: There is NO percentage field - calculate it manually!
meta().progress?: {
  loaded: number;   // Bytes transferred
  total: number;    // Total bytes (0 if unknown)
};

// Initial data plugin (only when initialData option is used)
meta().isInitialData?: boolean;

// Optimistic plugin (only during optimistic updates)
meta().isOptimistic?: boolean;

// Transform plugin (injectWrite only) - REQUIRES CASTING
// transformedData is typed as unknown, cast to your expected type
meta().transformedData as YourType;
```

**Example: Accessing progress**
```typescript
data = injectRead(
  (api) => api("file").GET(),
  { progress: true }  // Must enable progress!
);

// Types are inferred - no casting needed
progress = computed(() => this.data.meta().progress);

percentage = computed(() => {
  const p = this.progress();
  return p?.total && p.total > 0
    ? Math.round((p.loaded / p.total) * 100)
    : 0;
});
```

**Example: Accessing transformedData (requires casting)**
```typescript
mutation = injectWrite(
  (api) => api("data").POST(),
  { transform: (response) => response.items.map(normalize) }
);

async submit() {
  await this.mutation.trigger({ body: data });

  // transformedData requires casting
  const items = this.mutation.meta().transformedData as NormalizedItem[];
}
```
