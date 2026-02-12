/**
 * Example: Infinite scroll component with Spoosh
 *
 * This example demonstrates:
 * - Bidirectional infinite scrolling
 * - Intersection Observer for auto-loading
 * - Merged data from all pages
 * - Loading states for next/prev
 */

import { useInfiniteRead } from "@/lib/spoosh";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

// Types
interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  likeCount: number;
}

interface PostsResponse {
  items: Post[];
  page: number;
  hasMore: boolean;
  hasPrev: boolean;
}

interface PostFeedProps {
  authorId?: string;
}

// Main Component
export function PostFeed({ authorId }: PostFeedProps) {
  const { ref: bottomRef, inView: bottomInView } = useInView();
  const { ref: topRef, inView: topInView } = useInView();

  const {
    data,
    allResponses,
    loading,
    error,
    fetchingNext,
    fetchingPrev,
    canFetchNext,
    canFetchPrev,
    fetchNext,
    fetchPrev,
    trigger,
  } = useInfiniteRead(
    (api) =>
      api("posts").GET({
        query: {
          page: 1,
          limit: 20,
          ...(authorId ? { authorId } : {}),
        },
      }),
    {
      canFetchNext: ({ response }) => response?.hasMore ?? false,
      nextPageRequest: ({ response, request }) => ({
        query: {
          ...request.query,
          page: (response?.page ?? 0) + 1,
        },
      }),
      canFetchPrev: ({ response }) => response?.hasPrev ?? false,
      prevPageRequest: ({ response, request }) => ({
        query: {
          ...request.query,
          page: (response?.page ?? 2) - 1,
        },
      }),
      merger: (responses: PostsResponse[]) =>
        responses.flatMap((r) => r.items),
      staleTime: 30000,
    }
  );

  useEffect(() => {
    if (bottomInView && canFetchNext && !fetchingNext) {
      fetchNext();
    }
  }, [bottomInView, canFetchNext, fetchingNext, fetchNext]);

  useEffect(() => {
    if (topInView && canFetchPrev && !fetchingPrev) {
      fetchPrev();
    }
  }, [topInView, canFetchPrev, fetchingPrev, fetchPrev]);

  if (loading) {
    return <PostFeedSkeleton />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Failed to load posts: {error.message}</p>
        <button onClick={() => trigger()}>Retry</button>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="empty-state">
        <p>No posts yet</p>
        {authorId && <p>This author hasn't published any posts</p>}
      </div>
    );
  }

  return (
    <div className="post-feed">
      <div ref={topRef} className="load-trigger">
        {fetchingPrev && <LoadingSpinner size="small" />}
      </div>

      {data.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={bottomRef} className="load-trigger">
        {fetchingNext && <LoadingSpinner size="small" />}
        {!canFetchNext && data.length > 0 && (
          <p className="end-message">No more posts</p>
        )}
      </div>
    </div>
  );
}

// Post Card Component
function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <header>
        <h2>{post.title}</h2>
        <div className="meta">
          <span>By {post.author.name}</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </header>

      <p className="content">{post.content}</p>

      <footer>
        <span>{post.likeCount} likes</span>
      </footer>
    </article>
  );
}

// Loading Spinner
function LoadingSpinner({ size = "medium" }: { size?: "small" | "medium" }) {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner" />
    </div>
  );
}

// Skeleton
function PostFeedSkeleton() {
  return (
    <div className="post-feed skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="post-card skeleton">
          <div className="title-skeleton" />
          <div className="content-skeleton" />
          <div className="meta-skeleton" />
        </div>
      ))}
    </div>
  );
}
