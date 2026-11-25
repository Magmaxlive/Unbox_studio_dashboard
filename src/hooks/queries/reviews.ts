import { useBlogs } from "./blogs";
import { useVideos } from "./videos";
import type { Blog,BlogFilter } from "../../types/Blogs";
import type { Video,VideoFilter } from "../../types/Videos";

// fixed objects : the pae and the siderbar share the same chached queries.
const REVIEW_BLOG_FILTERS : BlogFilter = { status : 'pending' , ordering : 'submitted_at' , page_size : 50 };
const REVIEW_VIDEO_FILTERS : VideoFilter = { status : 'pending' , ordering : 'submitted_at' , page_size : 50 };

export type ReviewItem = 
    | { kind : 'blog' ; id : string; submittedAt : string ; item : Blog }
    | { kind : 'video' ; id : string; submittedAt : string ; item : Video }

// pending blogs and videos, oldest submission first (admins only).
export function useReviewQueue({enabled = true}:{enabled? : boolean } = {}) {
    const blogs = useBlogs(REVIEW_BLOG_FILTERS, {enabled});
    const videos = useVideos(REVIEW_VIDEO_FILTERS, {enabled});

    const items : ReviewItem[] = [
        ...(blogs.data?.results ?? []).map((item)=>({
            kind : 'blog' as const , id : item.id, item,
            submittedAt : item.submitted_at ?? item.created_at,
        })),

        ...(videos.data?.results ?? []).map((item)=>({
            kind : 'video' as const , id : item.id, item,
            submittedAt : item.submitted_at ?? item.created_at,
        })),
    ].sort((a,b)=>a.submittedAt.localeCompare(b.submittedAt));

    // the real totals, even beyond the 50 of each show

    const count = (blogs.data?.count ?? 0) + (videos.data?.count ?? 0);

    return {
        items,
        count,
        hasMore : items.length < count,
        isLoading : blogs.isLoading || videos.isLoading,
        isError : blogs.isError || videos.isError,
        isFetching : blogs.isFetching || videos.isFetching,
        refetch : ()=> {blogs.refetch(); videos.refetch();},
    }
}