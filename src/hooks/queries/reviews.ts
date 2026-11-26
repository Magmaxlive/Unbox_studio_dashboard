import { useBlogs } from './blogs'
import { useVideos } from './videos'
import type { Blog, BlogFilter } from '../../types/Blogs'
import type { Video, VideoFilter } from '../../types/Videos'

export type ReviewType = 'all' | 'blog' | 'video';

export type ReviewItem =
    | { kind : 'blog'; id : string; submittedAt : string; item : Blog }
    | { kind : 'video'; id : string; submittedAt : string; item : Video };

export const REVIEW_PAGE_SIZE = 12;
const ALL_TAB_LIMIT = 20;

interface ReviewQueueOptions {
    type : ReviewType;
    search : string;
    categorySlug : string;
    page : number;
}

// The review queue: pending items, oldest submission first.
// Blogs/Videos tabs page exactly on the server; "All" merges the oldest 50 of each.
export function useReviewQueue({ type, search, categorySlug, page }:ReviewQueueOptions) {
    const common = {
        status : 'pending' as const,
        ordering : 'submitted_at',
        ...(search ? { search } : {}),
        ...(categorySlug ? { category_slug : categorySlug } : {}),
    };
    const listParams = type === 'all'
        ? { page_size : ALL_TAB_LIMIT }
        : { page, page_size : REVIEW_PAGE_SIZE };

    const blogs = useBlogs({ ...common, ...listParams } as BlogFilter, { enabled : type !== 'video' });
    const videos = useVideos({ ...common, ...listParams } as VideoFilter, { enabled : type !== 'blog' });

    // tab counts, with the same search/category (one-item pages)
    const blogCount = useBlogs({ ...common, page_size : 1 } as BlogFilter).data?.count;
    const videoCount = useVideos({ ...common, page_size : 1 } as VideoFilter).data?.count;

    const items : ReviewItem[] = [
        ...(type !== 'video' ? blogs.data?.results ?? [] : []).map((item)=>({
            kind : 'blog' as const, id : item.id, item,
            submittedAt : item.submitted_at ?? item.created_at,
        })),
        ...(type !== 'blog' ? videos.data?.results ?? [] : []).map((item)=>({
            kind : 'video' as const, id : item.id, item,
            submittedAt : item.submitted_at ?? item.created_at,
        })),
    ].sort((a, b)=>a.submittedAt.localeCompare(b.submittedAt));

    const activeCount = type === 'blog' ? blogCount : type === 'video' ? videoCount : undefined;
    const totalAll = (blogCount ?? 0) + (videoCount ?? 0);

    const active = type === 'blog' ? [blogs] : type === 'video' ? [videos] : [blogs, videos];

    return {
        items,
        counts : { all : totalAll, blog : blogCount ?? 0, video : videoCount ?? 0 },
        totalPages : activeCount === undefined ? 1 : Math.max(1, Math.ceil(activeCount / REVIEW_PAGE_SIZE)),
        // "All" tab only: more pending than the merged view shows
        hasMore : type === 'all' && items.length < totalAll,
        isLoading : active.some((query)=>query.isLoading),
        isError : active.some((query)=>query.isError),
        isFetching : active.some((query)=>query.isFetching),
        refetch : () => active.forEach((query)=>query.refetch()),
    };
}

export function useReviewCount({ enabled = true }:{ enabled? : boolean } = {}) {
    // same filters as the Review page's unfiltered tab counts: one shared request
    const filters = { status : 'pending' as const, ordering : 'submitted_at', page_size : 1 };
    const blogs = useBlogs(filters as BlogFilter, { enabled });
    const videos = useVideos(filters as VideoFilter, { enabled });
    return (blogs.data?.count ?? 0) + (videos.data?.count ?? 0);
}