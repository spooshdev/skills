/**
 * Example: Complete data fetching component with Spoosh
 *
 * This example demonstrates:
 * - Basic data fetching with injectRead
 * - Loading and error states with signals
 * - Manual refetch
 * - Cache invalidation
 */

import { Component, computed, input, output } from "@angular/core";
import { injectRead, injectWrite } from "@/lib/spoosh";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
}

// Main Component
@Component({
  selector: "app-user-list",
  standalone: true,
  template: `
    @if (users.loading()) {
      <app-user-list-skeleton />
    } @else if (users.error()) {
      <div class="error-container">
        <p>Failed to load users: {{ users.error()!.message }}</p>
        <button (click)="users.trigger()">Retry</button>
      </div>
    } @else if (!users.data()?.length) {
      <div class="empty-state">
        <p>No users found</p>
        @if (departmentId()) {
          <p>Try selecting a different department</p>
        }
      </div>
    } @else {
      <div class="user-list">
        <header>
          <h2>Users ({{ userCount() }})</h2>
          <button (click)="users.trigger()">Refresh</button>
        </header>

        <ul>
          @for (user of users.data(); track user.id) {
            <app-user-card
              [user]="user"
              (deleted)="users.trigger()"
            />
          }
        </ul>
      </div>
    }
  `,
})
export class UserListComponent {
  departmentId = input<string>();

  users = injectRead(
    (api) =>
      api("users").GET({
        query: this.departmentId() ? { departmentId: this.departmentId() } : undefined,
      }),
    {
      staleTime: 30000,
      retry: { retries: 3 },
    }
  );

  userCount = computed(() => this.users.data()?.length ?? 0);
}

// User Card Component
@Component({
  selector: "app-user-card",
  standalone: true,
  template: `
    <li class="user-card">
      <img [src]="user().avatar" [alt]="user().name" />

      <div class="user-info">
        <h3>{{ user().name }}</h3>
        <p>{{ user().email }}</p>
        <small>Joined {{ formattedDate() }}</small>
      </div>

      <button (click)="handleDelete()" [disabled]="deleteUser.loading()">
        {{ deleteUser.loading() ? "Deleting..." : "Delete" }}
      </button>
    </li>
  `,
})
export class UserCardComponent {
  user = input.required<User>();
  deleted = output<void>();

  deleteUser = injectWrite((api) => api("users/:id").DELETE());

  formattedDate = computed(() =>
    new Date(this.user().createdAt).toLocaleDateString()
  );

  async handleDelete() {
    if (!confirm(`Delete ${this.user().name}?`)) return;

    const result = await this.deleteUser.trigger({
      params: { id: this.user().id },
      invalidate: "all",
    });

    if (result.data) {
      this.deleted.emit();
    }
  }
}
