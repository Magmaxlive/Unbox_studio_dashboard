import { useBlogs } from './blogs'
import { useVideos } from './videos'
import type { Blog, BlogFilter } from '../../types/Blogs'
import type { Video, VideoFilter } from '../../types/Videos'
import { keepPreviousData,useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { getReviewQueue, type ReviewQueueParams } from '../../api/reviews'

export type ReviewType = 'all' | 'blog' | 'video';

export type ReviewItem =
    | { kind : 'blog'; id : string; submittedAt : string; item : Blog }
    | { kind : 'video'; id : string; submittedAt : string; item : Video };

export const REVIEW_PAGE_SIZE = 12;

export const reviewKeys = {
    all : ['review'] as const,
    list : (params : ReviewQueueParams) => ['review',params] as const,
}
interface ReviewQueueOptions {
    type : ReviewType;
    search : string;
    categorySlug : string;
    page : number;
}

const toItem = (kind:'blog' | 'video', item:Blog | Video) : ReviewItem =>
    ({ kind,id : item.id, item, submittedAt : item.submitted_at ?? item.created_at } as ReviewItem );

// The review queue: pending items, oldest submission first.
// Blogs/Videos tabs page exactly on the server; "All" merges the oldest 50 of each.
export function useReviewQueue({ type, search, categorySlug, page }:ReviewQueueOptions) {
    const common = {
        status : 'pending' as const,
        ordering : 'submitted_at',
        ...(search ? { search } : {}),
        ...(categorySlug ? { category_slug : categorySlug } : {}),
    };
    const paging = { page, page_size : REVIEW_PAGE_SIZE };

    const reviewParams : ReviewQueueParams = {
        ...paging,
        ...(search ? {search} : {}),
        ...(categorySlug ? {category_slug : categorySlug} : {}),
    }

    const all = useQuery({
        queryKey : reviewKeys.list(reviewParams),
        queryFn : ()=> getReviewQueue(reviewParams),
        enabled : type === 'all',
        placeholderData : keepPreviousData,
        refetchInterval : (query) => (query.state.data?.results.length ? 30_000 : false),
        retry : (failureCount, error) =>
            !(isAxiosError(error) && error.response?.status === 404) && failureCount < 2,

    })

    const blogs = useBlogs({ ...common, ...paging } as BlogFilter, { enabled : type === 'blog' });
    const videos = useVideos({ ...common, ...paging } as VideoFilter, { enabled : type === 'video' });

    // tab counts, with the same search/category (one-item pages)
    const blogCount = useBlogs({ ...common, page_size : 1 } as BlogFilter).data?.count ?? 0;
    const videoCount = useVideos({ ...common, page_size : 1 } as VideoFilter).data?.count ?? 0;

    const active = type === 'all' ? all : type === 'video' ? videos : blogs;

    const items : ReviewItem[] = 
        type == 'all'
        ? (all.data?.results ?? []).map((entry)=>toItem(entry.kind,entry.item))
        : type === 'blog'
         ? (blogs.data?.results ?? []).map((item)=>toItem('blog',item))
         : (videos.data?.results ?? []).map((item)=>toItem('video',item))

    const activeCount = active.data?.count ?? 0

    

    return {
        items,
        counts : { all : blogCount + videoCount, blog : blogCount, video : videoCount },
        totalPages : Math.max(1, Math.ceil(activeCount / REVIEW_PAGE_SIZE)),
        isLoading : active.isLoading,
        isError : active.isError,
        error : active.error,
        isFetching : active.isFetching,
        refetch : () => { active.refetch(); },
    };
}

export function useReviewCount({ enabled = true }:{ enabled? : boolean } = {}) {
    const filters = { status : 'pending' as const, ordering : 'submitted_at', page_size : 1 };
    const blogs = useBlogs(filters as BlogFilter, { enabled });
    const videos = useVideos(filters as VideoFilter, { enabled });
    return (blogs.data?.count ?? 0) + (videos.data?.count ?? 0);
}