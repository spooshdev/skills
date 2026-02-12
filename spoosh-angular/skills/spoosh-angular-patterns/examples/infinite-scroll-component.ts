/**
 * Example: Infinite scroll component with Spoosh
 *
 * This example demonstrates:
 * - Bidirectional infinite scrolling with signals
 * - Intersection Observer for auto-loading
 * - Merged data from all pages
 * - Loading states for next/prev
 */

import {
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from "@angular/core";
import { injectInfiniteRead } from "@/lib/spoosh";

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

// Main Component
@Component({
  selector: "app-post-feed",
  standalone: true,
  template: `
    @if (posts.loading()) {
      <app-post-feed-skeleton />
    } @else if (posts.error()) {
      <div class="error-container">
        <p>Failed to load posts: {{ posts.error()!.message }}</p>
        <button (click)="posts.trigger()">Retry</button>
      </div>
    } @else if (!posts.data()?.length) {
      <div class="empty-state">
        <p>No posts yet</p>
        @if (authorId()) {
          <p>This author hasn't published any posts</p>
        }
      </div>
    } @else {
      <div class="post-feed">
        <div #topTrigger class="load-trigger">
          @if (posts.fetchingPrev()) {
            <app-loading-spinner size="small" />
          }
        </div>

        @for (post of posts.data(); track post.id) {
          <app-post-card [post]="post" />
        }

        <div #bottomTrigger class="load-trigger">
          @if (posts.fetchingNext()) {
            <app-loading-spinner size="small" />
          }
          @if (!posts.canFetchNext() && posts.data()!.length > 0) {
            <p class="end-message">No more posts</p>
          }
        </div>
      </div>
    }
  `,
})
export class PostFeedComponent implements OnDestroy {
  authorId = input<string>();

  topTrigger = viewChild<ElementRef>("topTrigger");
  bottomTrigger = viewChild<ElementRef>("bottomTrigger");

  posts = injectInfiniteRead(
    (api) =>
      api("posts").GET({
        query: {
          page: 1,
          limit: 20,
          ...(this.authorId() ? { authorId: this.authorId() } : {}),
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

  private topObserver?: IntersectionObserver;
  private bottomObserver?: IntersectionObserver;

  constructor() {
    effect(() => {
      this.setupTopObserver();
      this.setupBottomObserver();
    });
  }

  private setupTopObserver() {
    const element = this.topTrigger()?.nativeElement;

    if (element) {
      this.topObserver?.disconnect();
      this.topObserver = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            this.posts.canFetchPrev() &&
            !this.posts.fetchingPrev()
          ) {
            this.posts.fetchPrev();
          }
        },
        { threshold: 0.1 }
      );
      this.topObserver.observe(element);
    }
  }

  private setupBottomObserver() {
    const element = this.bottomTrigger()?.nativeElement;

    if (element) {
      this.bottomObserver?.disconnect();
      this.bottomObserver = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            this.posts.canFetchNext() &&
            !this.posts.fetchingNext()
          ) {
            this.posts.fetchNext();
          }
        },
        { threshold: 0.1 }
      );
      this.bottomObserver.observe(element);
    }
  }

  ngOnDestroy() {
    this.topObserver?.disconnect();
    this.bottomObserver?.disconnect();
  }
}

// Post Card Component
@Component({
  selector: "app-post-card",
  standalone: true,
  template: `
    <article class="post-card">
      <header>
        <h2>{{ post().title }}</h2>
        <div class="meta">
          <span>By {{ post().author.name }}</span>
          <span>{{ formattedDate() }}</span>
        </div>
      </header>

      <p class="content">{{ post().content }}</p>

      <footer>
        <span>{{ post().likeCount }} likes</span>
      </footer>
    </article>
  `,
})
export class PostCardComponent {
  post = input.required<Post>();

  formattedDate = computed(() =>
    new Date(this.post().createdAt).toLocaleDateString()
  );
}

import { computed } from "@angular/core";
