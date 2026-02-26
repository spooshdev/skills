# Spoosh Claude Code Plugins

> **Experimental**: These plugins are under active development and may change without notice.

This directory contains Claude Code plugins for Spoosh - a type-safe API toolkit with composable plugins for React and Angular.

## Available Plugins

| Plugin | Framework | Description |
|--------|-----------|-------------|
| [spoosh-react](./spoosh-react) | React | Hooks-based API with `useRead`, `useWrite`, `usePages` |
| [spoosh-angular](./spoosh-angular) | Angular | Signals-based API with `injectRead`, `injectWrite`, `injectPages` |

## Plugin Components

Each plugin provides:

### Skills

Contextual knowledge that loads automatically when you ask about Spoosh:

- **API Skills** - Complete API reference for hooks/signals and all plugins
- **Pattern Skills** - Best practices and component patterns

### Commands

User-invocable slash commands:

- `/generate-component` - Scaffold components with Spoosh data fetching
- `/spoosh-docs` - Quick access to documentation

### Agents

Autonomous component generators that trigger on natural language requests like "create a Spoosh component".

## Installation

See [Claude Code Plugin Documentation](https://code.claude.com/docs/en/discover-plugins) for installation instructions.

## Quick Start

### React

```
/spoosh-react:generate-component UserList --type=list
```

### Angular

```
/spoosh-angular:generate-component UserList --type=list
```

### Component Types

Both plugins support the same component types:

| Type | Description |
|------|-------------|
| `list` | Data list with loading/error states |
| `detail` | Single item display |
| `form` | Mutation form with optimistic updates |
| `infinite` | Infinite scroll pagination |

## Automatic Skill Activation

Skills load automatically when you ask about:

- Data fetching hooks/signals
- Plugin configuration (cache, retry, polling, etc.)
- Component patterns and best practices
- Error handling and loading states
- Optimistic updates and mutations

## Directory Structure

```
plugins/
├── README.md
├── spoosh-react/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── agents/
│   │   └── component-generator.md
│   ├── commands/
│   │   ├── generate-component.md
│   │   └── spoosh-docs.md
│   ├── skills/
│   │   ├── spoosh-react-api/
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   └── spoosh-react-patterns/
│   │       ├── SKILL.md
│   │       └── references/
│   └── README.md
└── spoosh-angular/
    ├── .claude-plugin/
    │   └── plugin.json
    ├── agents/
    │   └── component-generator.md
    ├── commands/
    │   ├── generate-component.md
    │   └── spoosh-docs.md
    ├── skills/
    │   ├── spoosh-angular-api/
    │   │   ├── SKILL.md
    │   │   └── references/
    │   └── spoosh-angular-patterns/
    │       ├── SKILL.md
    │       └── references/
    └── README.md
```

## Requirements

- Claude Code CLI
- Spoosh packages installed in your project:
  - React: `@spoosh/core`, `@spoosh/react`
  - Angular: `@spoosh/core`, `@spoosh/angular`

