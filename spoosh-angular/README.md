# Spoosh Angular Plugin

Claude Code plugin for Angular developers using Spoosh - a type-safe API toolkit with composable plugins and Angular signals.

## Features

### Skills

- **Spoosh Angular API** - Comprehensive API knowledge for `injectRead`, `injectWrite`, `injectInfiniteRead`, and all plugins
- **Spoosh Angular Patterns** - Component patterns and best practices for building Angular apps with Spoosh signals

### Commands

- `/spoosh-angular:generate-component` - Generate a new Angular component with Spoosh data fetching
- `/spoosh-angular:spoosh-docs` - Quick access to Spoosh Angular documentation

### Agents

- **component-generator** - Autonomous agent that creates complete Angular components with Spoosh integration

## Installation

### Option 1: Local development

```bash
cc --plugin-dir /path/to/plugins/spoosh-angular
```

### Option 2: Copy to project

Copy the `spoosh-angular` folder to your project's `.claude-plugin/` directory.

## Usage

### Generate a component

```
/spoosh-angular:generate-component UserList --type=list
```

Component types:
- `list` - Data list with loading/error states
- `detail` - Single item display
- `form` - Mutation form
- `infinite` - Infinite scroll

### Get documentation

```
/spoosh-angular:spoosh-docs signals
/spoosh-angular:spoosh-docs plugins
/spoosh-angular:spoosh-docs patterns
```

### Use the component generator agent

The agent triggers automatically when you ask to:
- "Create a Spoosh component"
- "Generate a data fetching component"
- "Build an Angular component with Spoosh"
- "Create an infinite scroll component"

## Skills Auto-Activation

Skills load automatically when you ask about:
- Spoosh signals (`injectRead`, `injectWrite`, `injectInfiniteRead`)
- Spoosh plugins (cache, retry, polling, etc.)
- Component patterns (data fetching, mutations, infinite scroll)
- Error handling, loading states, optimistic updates

## Angular-Specific Features

This plugin understands:
- Angular signals and reactivity
- New control flow syntax (`@if`, `@for`, `@switch`)
- Standalone components
- Signal-based inputs with `input()` and `output()`
- `computed()` and `effect()` usage

## Requirements

- Claude Code CLI
- An Angular project using Spoosh (`@spoosh/core`, `@spoosh/angular`)
