/**
 * Example: Complete data fetching component with Spoosh
 *
 * This example demonstrates:
 * - Basic data fetching with useRead
 * - Loading and error states
 * - Manual refetch
 * - Cache invalidation
 */

import { useRead, useWrite } from "@/lib/spoosh";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
}

interface UserListProps {
  departmentId?: string;
}

// Main Component
export function UserList({ departmentId }: UserListProps) {
  const { data, loading, error, trigger } = useRead(
    (api) =>
      api("users").GET({
        query: departmentId ? { departmentId } : undefined,
      }),
    {
      staleTime: 30000,
      retry: { retries: 3 },
    }
  );

  if (loading) {
    return <UserListSkeleton />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Failed to load users: {error.message}</p>
        <button onClick={() => trigger()}>Retry</button>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="empty-state">
        <p>No users found</p>
        {departmentId && <p>Try selecting a different department</p>}
      </div>
    );
  }

  return (
    <div className="user-list">
      <header>
        <h2>Users ({data.length})</h2>
        <button onClick={() => trigger()}>Refresh</button>
      </header>

      <ul>
        {data.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </ul>
    </div>
  );
}

// User Card Component
function UserCard({ user }: { user: User }) {
  const { trigger: deleteUser, loading: deleting } = useWrite(
    (api) => api("users/:id").DELETE()
  );

  const handleDelete = async () => {
    if (!confirm(`Delete ${user.name}?`)) return;

    await deleteUser({
      params: { id: user.id },
      invalidate: "all",
    });
  };

  return (
    <li className="user-card">
      <img src={user.avatar} alt={user.name} />

      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <small>Joined {new Date(user.createdAt).toLocaleDateString()}</small>
      </div>

      <button onClick={handleDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </li>
  );
}

// Skeleton Component
function UserListSkeleton() {
  return (
    <div className="user-list skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="user-card skeleton">
          <div className="avatar-skeleton" />
          <div className="info-skeleton">
            <div className="name-skeleton" />
            <div className="email-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
