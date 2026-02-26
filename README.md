# Spoosh Skills

Skills for building React and Angular applications with Spoosh type-safe API toolkit.

## Available Skills

| Skill | Framework | Description |
|-------|-----------|-------------|
| [spoosh-react](./skills/spoosh-react) | React | Hooks-based API with `useRead`, `useWrite`, `usePages`, `useQueue`, `useSSE` |
| [spoosh-angular](./skills/spoosh-angular) | Angular | Signals-based API with `injectRead`, `injectWrite`, `injectPages`, `injectQueue` |

## Installation

Add this repository as a Claude Code plugin:

```bash
claude plugins add /path/to/spoosh-skills
```

Or via marketplace (when available).

## Automatic Skill Activation

Skills load automatically when you ask about:

- Data fetching hooks/signals (`useRead`, `injectRead`, etc.)
- Pagination (`usePages`, `injectPages`)
- Queue management (`useQueue`, `injectQueue`)
- Server-sent events (`useSSE`)
- Plugin configuration (cache, retry, polling, optimistic, etc.)
- Component patterns and best practices
- Error handling and loading states

## Directory Structure

```
spoosh-skills/
├── .claude-plugin/
│   └── marketplace.json
├── skills/
│   ├── spoosh-react/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   └── examples/
│   └── spoosh-angular/
│       ├── SKILL.md
│       ├── references/
│       └── examples/
└── README.md
```

## Requirements

- Claude Code CLI
- Spoosh packages installed in your project:
  - React: `@spoosh/core`, `@spoosh/react`
  - Angular: `@spoosh/core`, `@spoosh/angular`
