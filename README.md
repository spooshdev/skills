# Spoosh Skills

Skills for building applications with Spoosh type-safe API toolkit.

## Installation

```
npx skills add spooshdev/skills
```

## Available Skills

| Skill                                     | Package           | Description                                                                      |
| ----------------------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| [spoosh-react](./skills/spoosh-react)     | `@spoosh/react`   | Hooks-based API with `useRead`, `useWrite`, `usePages`, `useQueue`, `useSSE`     |
| [spoosh-angular](./skills/spoosh-angular) | `@spoosh/angular` | Signals-based API with `injectRead`, `injectWrite`, `injectPages`, `injectQueue` |

## Automatic Skill Activation

Skills load automatically when you ask about:

- Data fetching hooks/signals (`useRead`, `injectRead`, etc.)
- Pagination (`usePages`, `injectPages`)
- Queue management (`useQueue`, `injectQueue`)
- Server-sent events (`useSSE`)
- Plugin configuration (cache, retry, polling, optimistic, devtool, etc.)
- Next.js integration and SSR
- Server type inference (Hono, Elysia)
- OpenAPI schema conversion
