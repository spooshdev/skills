---
name: generate-component
description: Generate an Angular component with Spoosh data fetching
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
argument-hint: "<component-name> [--type=list|detail|form|infinite]"
---

# Generate Spoosh Angular Component

Generate a new Angular component with Spoosh data fetching integration using signals.

## Process

1. **Parse Arguments**
   - Extract component name from arguments
   - Determine component type (default: list)
   - Types: `list` (data list), `detail` (single item), `form` (mutation), `infinite` (infinite scroll)

2. **Find Project Structure**
   - Search for existing Spoosh setup: `lib/spoosh.ts`, `services/spoosh.ts`, or similar
   - Identify components directory structure
   - Check for existing patterns in the codebase

3. **Determine File Location**
   - Use existing components directory if found
   - Default to `src/app/components/<component-name>/`
   - Ask user if location is unclear

4. **Generate Component**

   For **list** type:
   ```typescript
   import { Component, computed } from "@angular/core";
   import { injectRead } from "@/lib/spoosh";

   @Component({
     selector: "app-${selector}",
     standalone: true,
     template: `
       @if (items.loading()) {
         <app-${selector}-skeleton />
       } @else if (items.error()) {
         <app-error-message [error]="items.error()!" (retry)="items.trigger()" />
       } @else if (!items.data()?.length) {
         <app-empty-state />
       } @else {
         <ul>
           @for (item of items.data(); track item.id) {
             <app-${item-selector} [item]="item" />
           }
         </ul>
       }
     `,
   })
   export class ${ComponentName}Component {
     items = injectRead(
       (api) => api("${endpoint}").GET(),
       { staleTime: 30000 }
     );

     itemCount = computed(() => this.items.data()?.length ?? 0);
   }
   ```

   For **detail** type:
   ```typescript
   import { Component, input } from "@angular/core";
   import { injectRead } from "@/lib/spoosh";

   @Component({
     selector: "app-${selector}",
     standalone: true,
     template: `
       @if (!id()) {
         <app-select-prompt />
       } @else if (item.loading()) {
         <app-${selector}-skeleton />
       } @else if (item.error()) {
         <app-error-message [error]="item.error()!" />
       } @else {
         <app-${selector}-view [data]="item.data()!" />
       }
     `,
   })
   export class ${ComponentName}Component {
     id = input<string | null>(null);

     item = injectRead(
       (api) => api("${endpoint}/:id").GET({ params: { id: this.id()! } }),
       { enabled: () => !!this.id() }
     );
   }
   ```

   For **form** type:
   ```typescript
   import { Component, signal } from "@angular/core";
   import { FormsModule } from "@angular/forms";
   import { injectWrite } from "@/lib/spoosh";

   @Component({
     selector: "app-${selector}",
     standalone: true,
     imports: [FormsModule],
     template: `
       <form (ngSubmit)="handleSubmit()">
         <!-- Form fields -->
         @if (submit.error()) {
           <p class="error">{{ submit.error()!.message }}</p>
         }
         <button type="submit" [disabled]="submit.loading()">
           {{ submit.loading() ? "Submitting..." : "Submit" }}
         </button>
       </form>
     `,
   })
   export class ${ComponentName}Component {
     // Form fields as signals
     submit = injectWrite((api) => api("${endpoint}").POST());

     async handleSubmit() {
       const result = await this.submit.trigger({
         body: { /* form data */ },
         invalidate: "all"
       });

       if (result.data) {
         // Success handling
       }
     }
   }
   ```

   For **infinite** type:
   ```typescript
   import { Component, effect, ElementRef, viewChild, OnDestroy } from "@angular/core";
   import { injectInfiniteRead } from "@/lib/spoosh";

   @Component({
     selector: "app-${selector}",
     standalone: true,
     template: `
       @if (items.loading()) {
         <app-${selector}-skeleton />
       } @else if (items.error()) {
         <app-error-message [error]="items.error()!" />
       } @else {
         <div>
           @for (item of items.data(); track item.id) {
             <app-${item-selector} [item]="item" />
           }
           <div #loadTrigger>
             @if (items.fetchingNext()) {
               <app-loading-spinner />
             }
           </div>
         </div>
       }
     `,
   })
   export class ${ComponentName}Component implements OnDestroy {
     loadTrigger = viewChild<ElementRef>("loadTrigger");

     items = injectInfiniteRead(
       (api) => api("${endpoint}").GET({ query: { page: 1 } }),
       {
         canFetchNext: ({ response }) => response?.hasMore ?? false,
         nextPageRequest: ({ response, request }) => ({
           query: { ...request.query, page: (response?.page ?? 0) + 1 }
         }),
         merger: (responses) => responses.flatMap(r => r.items)
       }
     );

     private observer?: IntersectionObserver;

     constructor() {
       effect(() => {
         const element = this.loadTrigger()?.nativeElement;
         if (element) {
           this.observer?.disconnect();
           this.observer = new IntersectionObserver((entries) => {
             if (entries[0].isIntersecting && this.items.canFetchNext() && !this.items.fetchingNext()) {
               this.items.fetchNext();
             }
           });
           this.observer.observe(element);
         }
       });
     }

     ngOnDestroy() {
       this.observer?.disconnect();
     }
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
- Use existing import paths for Spoosh inject functions
- Follow project's component naming conventions
- Use Angular's new control flow syntax (@if, @for)
- Use standalone components by default
- Add JSDoc comments for inputs
- Do not add unnecessary comments in implementation
