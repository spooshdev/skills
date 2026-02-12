# Spoosh Type Inference Reference

## Server Type Inference

Spoosh supports automatic type inference from server definitions using adapters for Hono and Elysia.

## Hono Adapter

### Installation

```bash
pnpm add @spoosh/hono
```

### Server Setup

```typescript
// server.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

const app = new Hono()
  .basePath("/api")
  .get("/users", (c) => {
    return c.json([
      { id: "1", name: "Alice", email: "alice@example.com" }
    ]);
  })
  .post("/users", zValidator("json", createUserSchema), (c) => {
    const body = c.req.valid("json");
    return c.json({ id: "2", ...body });
  })
  .get("/users/:id", (c) => {
    const { id } = c.req.param();
    return c.json({ id, name: "Alice", email: "alice@example.com" });
  })
  .put("/users/:id", zValidator("json", createUserSchema), (c) => {
    const { id } = c.req.param();
    const body = c.req.valid("json");
    return c.json({ id, ...body });
  })
  .delete("/users/:id", (c) => {
    return c.json({ success: true });
  });

export type AppType = typeof app;
```

### Client Setup

```typescript
// client.ts
import { Spoosh } from "@spoosh/core";
import { HonoToSpoosh } from "@spoosh/hono";
import type { AppType } from "./server";

type ApiSchema = HonoToSpoosh<AppType>;

const spoosh = new Spoosh<ApiSchema>("/api");
```

### Type Mapping

| Hono | Spoosh |
|------|--------|
| `c.json(data)` | Response `data` type |
| `zValidator("json", schema)` | Request `body` type |
| `zValidator("query", schema)` | Request `query` type |
| `/users/:id` | Path `params` type |

## Elysia Adapter

### Installation

```bash
pnpm add @spoosh/elysia
```

### Server Setup

```typescript
// server.ts
import { Elysia, t } from "elysia";

const app = new Elysia()
  .get("/users", () => [
    { id: "1", name: "Alice", email: "alice@example.com" }
  ])
  .post("/users", ({ body }) => ({ id: "2", ...body }), {
    body: t.Object({
      name: t.String(),
      email: t.String()
    })
  })
  .get("/users/:id", ({ params }) => ({
    id: params.id,
    name: "Alice",
    email: "alice@example.com"
  }));

export type AppType = typeof app;
```

### Client Setup

```typescript
// client.ts
import { Spoosh } from "@spoosh/core";
import { ElysiaToSpoosh } from "@spoosh/elysia";
import type { AppType } from "./server";

type ApiSchema = ElysiaToSpoosh<AppType>;

const spoosh = new Spoosh<ApiSchema>("/api");
```

## Manual Schema Definition

For servers without adapters, define schema manually:

```typescript
type ApiSchema = {
  "users": {
    GET: { data: User[] };
    POST: { data: User; body: CreateUserBody };
  };
  "users/:id": {
    GET: { data: User };
    PUT: { data: User; body: UpdateUserBody };
    DELETE: { data: void };
  };
  "users/:id/posts": {
    GET: { data: Post[]; query: { limit?: number; offset?: number } };
  };
};
```

### Schema Type Structure

```typescript
type EndpointConfig = {
  GET?: {
    data: TData;                    // Response data type
    query?: TQuery;                 // Query parameters type
  };
  POST?: {
    data: TData;                    // Response data type
    body: TBody;                    // Request body type
  };
  PUT?: {
    data: TData;
    body: TBody;
  };
  PATCH?: {
    data: TData;
    body: TBody;
  };
  DELETE?: {
    data: TData;
  };
};
```

## Type Utilities

### StripPrefix

Remove base path prefix from all routes:

```typescript
import type { StripPrefix } from "@spoosh/core";

// Server routes: /api/users, /api/posts
// Client routes: users, posts
type ApiSchema = StripPrefix<HonoToSpoosh<AppType>, "/api">;
```

### ReadPaths / WritePaths

Get paths for specific operations:

```typescript
import type { ReadPaths, WritePaths } from "@spoosh/core";

type GetEndpoints = ReadPaths<ApiSchema>;   // Paths with GET
type MutationEndpoints = WritePaths<ApiSchema>;  // Paths with POST/PUT/DELETE
```

### SpooshSchema Helper

Type-check your schema definition:

```typescript
import type { SpooshSchema } from "@spoosh/core";

// TypeScript will error if schema is invalid
const schema: SpooshSchema<ApiSchema> = {} as ApiSchema;
```

## Best Practices

1. **Prefer server type inference** when using Hono or Elysia
2. **Export server type** as `AppType` from server file
3. **Use StripPrefix** when server has base path
4. **Keep schema in sync** with server when defining manually
5. **Use zod validators** in Hono for automatic body/query types
