---
name: spoosh-docs
description: Quick access to Spoosh Angular documentation and examples
allowed-tools:
  - Read
  - WebSearch
  - WebFetch
argument-hint: "[topic: signals|plugins|patterns|setup]"
---

# Spoosh Angular Documentation

Provide quick access to Spoosh documentation based on the requested topic.

## Process

1. **Parse Topic**
   - Extract topic from arguments
   - Default to overview if no topic specified
   - Topics: `signals`, `plugins`, `patterns`, `setup`, `infinite`, `mutations`, `cache`, `retry`, `queue`

2. **Load Relevant Skill**
   - For API questions: Load `spoosh-angular-api` skill knowledge
   - For patterns: Load `spoosh-angular-patterns` skill knowledge

3. **Provide Documentation**

   For **signals**:
   - Explain `injectRead`, `injectWrite`, `injectPages`, `injectQueue`
   - Show signal-based return types
   - Provide quick examples with Angular templates

   For **plugins**:
   - List all available plugins
   - Explain plugin setup
   - Show per-request options

   For **patterns**:
   - Common component patterns
   - Error handling with @if
   - Loading states
   - Optimistic updates

   For **setup**:
   - Installation steps
   - Spoosh instance creation
   - Angular inject functions creation
   - TypeScript setup

   For **infinite**:
   - `injectPages` detailed guide
   - Pagination options
   - Bidirectional scrolling
   - Merger function

   For **mutations**:
   - `injectWrite` guide
   - Cache invalidation
   - Optimistic updates
   - Form handling with FormsModule

   For **cache**:
   - Cache plugin configuration
   - Stale time
   - Manual invalidation
   - Cache clearing

   For **retry**:
   - Retry plugin configuration
   - Custom retry logic
   - Backoff strategies

   For **queue**:
   - `injectQueue` for batch operations
   - Concurrency control
   - Task states and stats (signals)
   - Retry failed tasks

4. **Include Examples**
   - Show relevant code examples with Angular templates
   - Reference example files in the plugin
   - Link to repository examples if helpful

5. **Suggest Related Topics**
   - Recommend related documentation
   - Mention advanced patterns if applicable

## Quick Reference

### Core Inject Functions

```typescript
// Fetch data (returns signals)
items = injectRead((api) => api("path").GET());
// items.data(), items.loading(), items.error()

// Mutations (note: HTTP method has parentheses)
submit = injectWrite((api) => api("path").POST());
// await submit.trigger({ body: data })

// Infinite scroll
items = injectPages(
  (api) => api("path").GET({ query: { page: 1 } }),
  { canFetchNext, nextPageRequest, merger }
);
// items.fetchNext(), items.canFetchNext()

// Queue (batch operations)
queue = injectQueue(
  (api) => api("items").POST(),
  { concurrency: 3 }
);
// queue.tasks(), queue.stats(), queue.retry()
```

### Angular Template Usage

```html
@if (items.loading()) {
  <app-skeleton />
} @else if (items.error()) {
  <app-error [error]="items.error()!" />
} @else {
  @for (item of items.data(); track item.id) {
    <app-item [item]="item" />
  }
}
```

### Common Plugins

| Plugin | Purpose |
|--------|---------|
| cache | Response caching |
| retry | Automatic retries |
| invalidation | Cache invalidation |
| polling | Auto-refresh |
| debounce | Debounce requests |
| optimistic | Instant UI updates |

## Output Format

Present documentation in clear, scannable format:
- Use code blocks for examples
- Use tables for quick reference
- Keep explanations concise
- Include practical Angular examples
