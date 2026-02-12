---
name: spoosh-docs
description: Quick access to Spoosh React documentation and examples
allowed-tools:
  - Read
  - WebSearch
  - WebFetch
argument-hint: "[topic: hooks|plugins|patterns|setup]"
---

# Spoosh React Documentation

Provide quick access to Spoosh documentation based on the requested topic.

## Process

1. **Parse Topic**
   - Extract topic from arguments
   - Default to overview if no topic specified
   - Topics: `hooks`, `plugins`, `patterns`, `setup`, `infinite`, `mutations`, `cache`, `retry`

2. **Load Relevant Skill**
   - For API questions: Load `spoosh-react-api` skill knowledge
   - For patterns: Load `spoosh-react-patterns` skill knowledge

3. **Provide Documentation**

   For **hooks**:
   - Explain `useRead`, `useWrite`, `useInfiniteRead`
   - Show signatures and options
   - Provide quick examples

   For **plugins**:
   - List all available plugins
   - Explain plugin setup
   - Show per-request options

   For **patterns**:
   - Common component patterns
   - Error handling
   - Loading states
   - Optimistic updates

   For **setup**:
   - Installation steps
   - Spoosh instance creation
   - React hooks creation
   - TypeScript setup

   For **infinite**:
   - `useInfiniteRead` detailed guide
   - Pagination options
   - Bidirectional scrolling
   - Merger function

   For **mutations**:
   - `useWrite` guide
   - Cache invalidation
   - Optimistic updates
   - Form handling

   For **cache**:
   - Cache plugin configuration
   - Stale time
   - Manual invalidation
   - Cache clearing

   For **retry**:
   - Retry plugin configuration
   - Custom retry logic
   - Backoff strategies

4. **Include Examples**
   - Show relevant code examples
   - Reference example files in the plugin
   - Link to repository examples if helpful

5. **Suggest Related Topics**
   - Recommend related documentation
   - Mention advanced patterns if applicable

## Quick Reference

### Core Hooks

```typescript
// Fetch data
const { data, loading, error } = useRead(
  (api) => api("path").GET()
);

// Mutations (note: HTTP method has parentheses)
const { trigger, loading } = useWrite(
  (api) => api("path").POST()
);

// Infinite scroll
const { data, fetchNext, canFetchNext } = useInfiniteRead(
  (api) => api("path").GET({ query: { page: 1 } }),
  { canFetchNext, nextPageRequest, merger }
);
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
- Include practical examples
