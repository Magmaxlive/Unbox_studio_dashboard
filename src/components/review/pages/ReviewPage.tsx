import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, FileText, Film, Search, X } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useReviewQueue, type ReviewItem, type ReviewType } from '../../../hooks/queries/reviews'
import { useCategoryOptions } from '../../../hooks/queries/categories'
import UseDebounce from '../../../hooks/UseDebounce'
import { formatWaiting, waitingDays } from '../../../utlis/formatWaiting'
import { REVIEW_PATH } from '../../../constants/routes'
import BlogCategoryBadge from '../../blog/BlogCategoryBadge'
import BlogViewModal from '../../blog/BlogViewModal'
import VideoViewModal from '../../video/VideoViewModal'
import Pagination from '../../ui/Pagination'
import type { Blog } from '../../../types/Blogs'
import type { Video } from '../../../types/Videos'

const OVERDUE_DAYS = 3;
const TYPES : ReviewType[] = ['all', 'blog', 'video'];
const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;

const TAB_LABELS : Record<ReviewType, string> = { all : 'All', blog : 'Blogs', video : 'Videos' };

const thClass = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
const tdClass = "px-4 py-3 align-middle"
const controlClass = 'h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-gray-900'

const thumbnailOf = (entry:ReviewItem) =>
    entry.kind === 'blog'
        ? entry.item.cover_image_detail?.thumbnail_url ?? null
        : entry.item.thumbnail_detail?.thumbnail_url ?? entry.item.media?.poster_url ?? null;

const ReviewPage = () => {
    const {user} = useAuth();
    const navigate = useNavigate();
    const { data:categories = [] } = useCategoryOptions();

    // ── filters live in the URL ──
    const [searchParams, setSearchParams] = useSearchParams();

    const typeParam = searchParams.get('type') as ReviewType | null;
    const type : ReviewType = typeParam && TYPES.includes(typeParam) ? typeParam : 'all';

    const pageParam = Number(searchParams.get('page'));
    const page = type !== 'all' && Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

    const categoryParam = searchParams.get('category') ?? '';
    const categorySlug = SLUG_PATTERN.test(categoryParam) ? categoryParam : '';

    const urlSearch = (searchParams.get('search') ?? '').trim();

    const updateParams = (changes:Record<string, string | null>, { resetPage = true, replace = false } = {}) => {
        setSearchParams((previous)=>{
            const next = new URLSearchParams(previous);
            Object.entries(changes).forEach(([key, value])=>{
                if (value) next.set(key, value);
                else next.delete(key);
            });
            if (resetPage) next.delete('page');
            return next;
        }, { replace });
    }

    // search: local while typing, written to the URL after the debounce
    const [searchInput, setSearchInput] = useState(urlSearch);
    const debouncedSearch = UseDebounce(searchInput.trim());

    useEffect(()=>{
        if (debouncedSearch !== urlSearch) updateParams({ search : debouncedSearch || null }, { replace : true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[debouncedSearch])

    useEffect(()=>{
        if (urlSearch !== searchInput.trim()) setSearchInput(urlSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[urlSearch])

    const queue = useReviewQueue({ type, search : urlSearch, categorySlug, page });
    const hasFilters = Boolean(urlSearch || categorySlug);

    // ── modals ──
    const [blogToView, setBlogToView] = useState<Blog | null>(null);
    const [videoToView, setVideoToView] = useState<Video | null>(null);

    const openItem = (entry:ReviewItem) => {
        if (entry.kind === 'blog') setBlogToView(entry.item);
        else setVideoToView(entry.item);
    }

    // editing from here comes back here, to the same filtered view
    const returnTo = `${REVIEW_PATH}${window.location.search}`;
    const editBlog = (blog:Blog) => {
        setBlogToView(null);
        navigate(`/blogs/${blog.id}/edit`, { state : { returnTo } });
    }
    const editVideo = (video:Video) => {
        setVideoToView(null);
        navigate(`/videos/${video.id}/edit`, { state : { returnTo } });
    }

    const renderContent = () => {
        if (queue.isLoading) return <p className="text-sm text-gray-500">Loading the review queue...</p>;

        if (queue.isError) {
            return (
                <div className="rounded-xl border border-red-100 bg-white px-6 py-10 text-center">
                    <p className="text-sm text-red-600">Couldn't load the review queue.</p>
                    <button
                        type="button"
                        onClick={queue.refetch}
                        className="mt-4 cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Retry
                    </button>
                </div>
            )
        }

        if (!queue.items.length) {
            return (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                    {hasFilters ? (
                        <>
                            <h3 className="font-semibold text-gray-900">Nothing matches these filters</h3>
                            <p className="mt-1 text-sm text-gray-500">Try a different search or category.</p>
                        </>
                    ) : (
                        <>
                            <CheckCircle size={32} className="mx-auto text-green-500" />
                            <h3 className="mt-3 font-semibold text-gray-900">All caught up</h3>
                            <p className="mt-1 text-sm text-gray-500">Nothing is waiting for review. New submissions will appear here.</p>
                        </>
                    )}
                </div>
            )
        }

        return (
            <div className={`overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity ${queue.isFetching ? 'opacity-70' : ''}`}>
                <table className="w-full min-w-[760px] text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th scope="col" className={thClass}>item</th>
                            <th scope="col" className={thClass}>contributor</th>
                            <th scope="col" className={thClass}>category</th>
                            <th scope="col" className={thClass}>waiting</th>
                            <th scope="col" className={thClass}><span className="sr-only">Review</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {queue.items.map((entry)=>{
                            const image = thumbnailOf(entry);
                            const overdue = waitingDays(entry.submittedAt) >= OVERDUE_DAYS;
                            const Icon = entry.kind === 'blog' ? FileText : Film;

                            return (
                                <tr
                                    key={`${entry.kind}-${entry.id}`}
                                    onClick={()=>openItem(entry)}
                                    className="cursor-pointer transition hover:bg-gray-50"
                                >
                                    <td className={tdClass}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400">
                                                {image
                                                    ? <img src={image} alt="" loading="lazy" className="size-full object-cover" />
                                                    : <Icon size={18} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="line-clamp-1 font-medium text-gray-900">{entry.item.title}</p>
                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                                    <Icon size={12} /> {entry.kind === 'blog' ? 'Blog' : 'Video'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={tdClass}>
                                        <span className="whitespace-nowrap capitalize text-gray-700">{entry.item.contributor_name}</span>
                                    </td>
                                    <td className={tdClass}>
                                        <BlogCategoryBadge category={entry.item.category_detail} />
                                    </td>
                                    <td className={tdClass}>
                                        <time
                                            dateTime={entry.submittedAt}
                                            className={`whitespace-nowrap font-medium ${overdue ? 'text-amber-600' : 'text-gray-600'}`}
                                            title={new Date(entry.submittedAt).toLocaleString()}
                                        >
                                            {formatWaiting(entry.submittedAt)}
                                        </time>
                                    </td>
                                    <td className={`${tdClass} text-right`}>
                                        <button
                                            type="button"
                                            onClick={(e)=>{ e.stopPropagation(); openItem(entry); }}
                                            className="cursor-pointer rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-900"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    }

  return (
    <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Review</h1>
            <p className="mt-1 text-sm text-gray-500">Pending blogs and videos, oldest first.</p>
        </div>

        {/* type tabs with counts */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Content type">
            {TYPES.map((tab)=>{
                const selected = tab === type;
                return (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={()=>updateParams({ type : tab === 'all' ? null : tab })}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                            selected ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {TAB_LABELS[tab]}
                        <span className={`rounded-full px-2 py-0.5 text-xs ${selected ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                            {queue.counts[tab]}
                        </span>
                    </button>
                )
            })}
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="relative w-full sm:w-auto sm:min-w-64 sm:flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={searchInput}
                    onChange={(e)=>setSearchInput(e.target.value)}
                    placeholder="Search by title or contributor…"
                    aria-label="Search the review queue"
                    className={`${controlClass} w-full pl-9 pr-3 placeholder:text-gray-400`}
                />
            </div>

            <select
                value={categorySlug}
                onChange={(e)=>updateParams({ category : e.target.value || null })}
                aria-label="Filter by category"
                className={`${controlClass} w-full cursor-pointer px-3 capitalize sm:w-44`}
            >
                <option value="">All categories</option>
                {categories.map((cat)=>(
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
            </select>

            {hasFilters && (
                <button
                    type="button"
                    onClick={()=>{ setSearchInput(''); updateParams({ search : null, category : null }); }}
                    className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm text-white font-medium bg-gray-500 transition hover:bg-gray-100 hover:bg-gray-900"
                >
                    <X size={14}/> Clear filters
                </button>
            )}
        </div>

        {renderContent()}

        {type !== 'all' && !queue.isError && (
            <Pagination
                currentPage={page}
                totalPages={queue.totalPages}
                onPageChange={(next)=>updateParams({ page : next > 1 ? String(next) : null }, { resetPage : false })}
                isLoading={queue.isFetching}
            />
        )}

        {queue.hasMore && (
            <p className="text-xs text-gray-500">
                Showing the oldest 50 blogs and 50 videos.{' '}
                <button type="button" onClick={()=>updateParams({ type : 'blog' })} className="cursor-pointer font-medium text-gray-700 underline">Blogs</button>
                {' '}or{' '}
                <button type="button" onClick={()=>updateParams({ type : 'video' })} className="cursor-pointer font-medium text-gray-700 underline">Videos</button>
                {' '}lets you page through everything.
            </p>
        )}

        {blogToView && (
            <BlogViewModal
                blog={blogToView}
                user={user}
                isAdmin
                onClose={()=>setBlogToView(null)}
                onEdit={editBlog}
            />
        )}

        {videoToView && (
            <VideoViewModal
                video={videoToView}
                user={user}
                isAdmin
                onClose={()=>setVideoToView(null)}
                onEdit={editVideo}
            />
        )}
    </div>
  )
}

export default ReviewPage