# Spoosh React Plugin

Claude Code plugin for React developers using Spoosh - a type-safe API toolkit with composable plugins.

## Features

### Skills

- **Spoosh React API** - Comprehensive API knowledge for `useRead`, `useWrite`, `usePages`, `useQueue`, `useSSE`, and all plugins
- **Spoosh React Patterns** - Component patterns and best practices for building React apps with Spoosh

### Commands

- `/spoosh-react:generate-component` - Generate a new React component with Spoosh data fetching
- `/spoosh-react:spoosh-docs` - Quick access to Spoosh React documentation

### Agents

- **component-generator** - Autonomous agent that creates complete React components with Spoosh integration

## Installation

### Option 1: Local development

```bash
cc --plugin-dir /path/to/plugins/spoosh-react
```

### Option 2: Copy to project

Copy the `spoosh-react` folder to your project's `.claude-plugin/` directory.

## Usage

### Generate a component

```
/spoosh-react:generate-component UserList --type=list
```

Component types:
- `list` - Data list with loading/error states
- `detail` - Single item display
- `form` - Mutation form
- `infinite` - Infinite scroll

### Get documentation

```
/spoosh-react:spoosh-docs hooks
/spoosh-react:spoosh-docs plugins
/spoosh-react:spoosh-docs patterns
```

### Use the component generator agent

The agent triggers automatically when you ask to:
- "Create a Spoosh component"
- "Generate a data fetching component"
- "Build a React component with Spoosh"
- "Create an infinite scroll component"

## Skills Auto-Activation

Skills load automatically when you ask about:
- Spoosh hooks (`useRead`, `useWrite`, `usePages`, `useQueue`, `useSSE`)
- Spoosh plugins (cache, retry, polling, etc.)
- Component patterns (data fetching, mutations, infinite scroll)
- Error handling, loading states, optimistic updates

## Requirements

- Claude Code CLI
- A React project using Spoosh (`@spoosh/core`, `@spoosh/react`)
