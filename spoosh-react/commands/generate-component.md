---
name: generate-component
description: Generate a React component with Spoosh data fetching
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
argument-hint: "<component-name> [--type=list|detail|form|infinite]"
---

# Generate Spoosh React Component

Generate a new React component with Spoosh data fetching integration.

## Process

1. **Parse Arguments**
   - Extract component name from arguments
   - Determine component type (default: list)
   - Types: `list` (data list), `detail` (single item), `form` (mutation), `infinite` (infinite scroll)

2. **Find Project Structure**
   - Search for existing Spoosh setup: `lib/spoosh.ts`, `api/spoosh.ts`, or similar
   - Identify components directory structure
   - Check for existing patterns in the codebase

3. **Determine File Location**
   - Use existing components directory if found
   - Default to `src/components/<ComponentName>/`
   - Ask user if location is unclear

4. **Generate Component**

   For **list** type:
   ```typescript
   import { useRead } from "@/lib/spoosh";

   export function ${ComponentName}() {
     const { data, loading, error, trigger } = useRead(
       (api) => api("${endpoint}").GET(),
       { staleTime: 30000 }
     );

     if (loading) return <${ComponentName}Skeleton />;
     if (error) return <ErrorMessage error={error} onRetry={trigger} />;
     if (!data?.length) return <EmptyState />;

     return (
       <ul>
         {data.map((item) => (
           <${ItemComponent} key={item.id} item={item} />
         ))}
       </ul>
     );
   }
   ```

   For **detail** type:
   ```typescript
   import { useRead } from "@/lib/spoosh";

   interface ${ComponentName}Props {
     id: string;
   }

   export function ${ComponentName}({ id }: ${ComponentName}Props) {
     const { data, loading, error } = useRead(
       (api) => api("${endpoint}/:id").GET({ params: { id } }),
       { enabled: !!id }
     );

     if (loading) return <${ComponentName}Skeleton />;
     if (error) return <ErrorMessage error={error} />;
     if (!data) return null;

     return <${ComponentName}View data={data} />;
   }
   ```

   For **form** type:
   ```typescript
   import { useWrite } from "@/lib/spoosh";
   import { useState } from "react";

   export function ${ComponentName}() {
     const [formData, setFormData] = useState({ /* fields */ });
     const { trigger, loading, error } = useWrite(
       (api) => api("${endpoint}").POST()
     );

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       const result = await trigger({
         body: formData,
         invalidate: "all"
       });
       if (result.data) {
         // Success handling
       }
     };

     return (
       <form onSubmit={handleSubmit}>
         {/* Form fields */}
         {error && <p className="error">{error.message}</p>}
         <button type="submit" disabled={loading}>
           {loading ? "Submitting..." : "Submit"}
         </button>
       </form>
     );
   }
   ```

   For **infinite** type:
   ```typescript
   import { usePages } from "@/lib/spoosh";
   import { useInView } from "react-intersection-observer";
   import { useEffect } from "react";

   export function ${ComponentName}() {
     const { ref, inView } = useInView();
     const {
       data, loading, fetchingNext, canFetchNext, fetchNext, error
     } = usePages(
       (api) => api("${endpoint}").GET({ query: { page: 1 } }),
       {
         canFetchNext: ({ lastPage }) => lastPage?.data?.hasMore ?? false,
         nextPageRequest: ({ lastPage, request }) => ({
           query: { ...request.query, page: (lastPage?.data?.page ?? 0) + 1 }
         }),
         merger: (pages) => pages.flatMap(p => p.data?.items ?? [])
       }
     );

     useEffect(() => {
       if (inView && canFetchNext && !fetchingNext) fetchNext();
     }, [inView, canFetchNext, fetchingNext, fetchNext]);

     if (loading) return <${ComponentName}Skeleton />;
     if (error) return <ErrorMessage error={error} />;

     return (
       <div>
         {data?.map((item) => <${ItemComponent} key={item.id} item={item} />)}
         <div ref={ref}>{fetchingNext && <LoadingSpinner />}</div>
       </div>
     );
   }
   ```

5. **Ask for API Endpoint**
   - Ask user which API endpoint this component should fetch from
   - Check existing API schema if available

6. **Create Supporting Files**
   - Create skeleton component if patterns exist in codebase
   - Add TypeScript types based on API schema

7. **Output Summary**
   - Show created files
   - Provide usage example
   - Suggest next steps (add to routes, customize styling)

## Important Notes

- Match existing code style in the project
- Use existing import paths for Spoosh hooks
- Follow project's component naming conventions
- Add JSDoc comments for props
- Do not add unnecessary comments in implementation
