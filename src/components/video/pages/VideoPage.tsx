import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { Video, VideoFilter, VideoSourceType, VideoStatus } from '../../../types/Videos'
import type { BulkResult } from '../../../types/Blogs'
import { useDeleteVideo, useVideoBulkAction, useVideos } from '../../../hooks/queries/videos'
import { useCategoryOptions } from '../../../hooks/queries/categories'
import UseDebounce from '../../../hooks/UseDebounce'
import { useAuth } from '../../../contexts/AuthContext'
import { handleMutationError } from '../../../utlis/handleMutationError'
import { startOfLocalDayISO, startOfNextLocalDayISO } from '../../../utlis/dateRange'
import VideoTable from '../VideoTable'
import BulkActionBar from '../../bulk/BulkActionBar'
import Pagination from '../../ui/Pagination'
import ConfirmDialog from '../../ui/ConfirmDialog'
import CreateButton from '../../ui/CreateButton'
import {
    VIDEO_NOUN,
    getAvailableBulkModes,
    getBulkModeConfig,
    pluralise,
    type BulkMode,
} from '../../bulk/bulkActions'
import ContentFilters from '../../filters/ContentFilter'
import VideoViewModal from '../VideoViewModal'

const PAGE_SIZE = 12;
const BULK_PAGE_SIZE = 20;

const VIDEO_STATUSES : VideoStatus[] = ['draft', 'pending', 'published', 'rejected', 'archived'];
const SOURCE_TYPES : VideoSourceType[] = ['upload', 'embed'];
const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface UpdateParamsOptions {
    resetPage? : boolean;
    replace? : boolean;
}

const BULK_CONFIRM_DESCRIPTION : Record<BulkMode, string> = {
    archive : 'They will be removed from the public website. You can restore them later.',
    restore : 'They will be visible on the public website again.',
    category : '',
    delete : 'They will be permanently deleted. This cannot be undone.',
};

const VideoPage = () => {
    const {user} = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();
    const location = useLocation();

    // ── filters + bulk mode live in the URL ──
    const [searchParams,setSearchParams] = useSearchParams();

    const pageParam = Number(searchParams.get('page'));
    const currentPage = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

    const statusParam = searchParams.get('status') ?? '';
    const status : VideoStatus | '' = VIDEO_STATUSES.includes(statusParam as VideoStatus) ? statusParam as VideoStatus : '';

    const typeParam = searchParams.get('type') ?? '';
    const sourceType : VideoSourceType | '' = SOURCE_TYPES.includes(typeParam as VideoSourceType) ? typeParam as VideoSourceType : '';

    const categoryParam = searchParams.get('category') ?? '';
    const categorySlug = SLUG_PATTERN.test(categoryParam) ? categoryParam : '';

    const fromParam = searchParams.get('from') ?? '';
    const toParam = searchParams.get('to') ?? '';
    const dateFrom = isAdmin && DATE_PATTERN.test(fromParam) ? fromParam : '';
    const dateTo = isAdmin && DATE_PATTERN.test(toParam) ? toParam : '';

    const urlSearch = (searchParams.get('search') ?? '').trim();

    const availableBulkModes = getAvailableBulkModes(isAdmin);
    const bulkParam = searchParams.get('bulk') as BulkMode | null;
    const bulkMode = bulkParam && availableBulkModes.includes(bulkParam) ? bulkParam : null;
    const bulkConfig = bulkMode ? getBulkModeConfig(bulkMode, isAdmin, VIDEO_NOUN) : null;

    const updateParams = (
        changes : Record<string, string | null>,
        { resetPage = true, replace = false } : UpdateParamsOptions = {},
    ) => {
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

    // ── search: local while typing, written to the URL after the debounce ──
    const [searchInput,setSearchInput] = useState(urlSearch);
    const debouncedSearch = UseDebounce(searchInput.trim());

    useEffect(()=>{
        if (debouncedSearch !== urlSearch) {
            updateParams({ search : debouncedSearch || null }, { replace : true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[debouncedSearch])

    useEffect(()=>{
        if (urlSearch !== searchInput.trim()) setSearchInput(urlSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[urlSearch])

    // ── bulk selection (cleared whenever the URL changes) ──
    const [selectedIds,setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkCategory,setBulkCategory] = useState('');
    const [isBulkConfirmOpen,setIsBulkConfirmOpen] = useState(false);

    useEffect(()=>{
        setSelectedIds(new Set());
    },[location.search])

    // view (V6b) + delete
    const [videoToView, setVideoToView] = useState<Video | null>(null);
    const [videoToDelete,setVideoToDelete] = useState<Video | null>(null);

    // ── API filters ──
    const filters : VideoFilter = { page : currentPage };
    if (urlSearch) filters.search = urlSearch;
    if (categorySlug) filters.category_slug = categorySlug;
    if (sourceType) filters.source_type = sourceType;

    if (bulkConfig) {
        filters.status_in = bulkConfig.statuses.join(',');
        filters.page_size = BULK_PAGE_SIZE;
    } else if (status) {
        filters.status = status;
    }

    if (dateFrom) {
        const createdAfter = startOfLocalDayISO(dateFrom);
        if (createdAfter) filters.created_after = createdAfter;
    }
    if (dateTo) {
        const createdBefore = startOfNextLocalDayISO(dateTo);
        if (createdBefore) filters.created_before = createdBefore;
    }

    const { data, isLoading, isError, error, refetch, isFetching } = useVideos(filters);
    const deleteMutation = useDeleteVideo();
    const bulkMutation = useVideoBulkAction();
    const { data:categoryOptions = [] } = useCategoryOptions();

    const videos = data?.results ?? [];
    const totalCount = data?.count ?? 0;
    const pageSize = bulkConfig ? BULK_PAGE_SIZE : PAGE_SIZE;
    const totalPages = Math.ceil(totalCount / pageSize);

    const hasActiveFilters = Boolean(urlSearch || (!bulkConfig && status) || sourceType || categorySlug || dateFrom || dateTo);

    // ── filter handlers ──
    const handlePageChange = (page:number) => {
        updateParams({ page : page > 1 ? String(page) : null }, { resetPage : false });
    }

    const handleClearFilters = () => {
        setSearchInput('');
        const next = new URLSearchParams();
        if (bulkMode) next.set('bulk', bulkMode);
        setSearchParams(next);
    }

    // ── bulk mode ──
    const handleBulkModeChange = (mode:BulkMode | '') => {
        setBulkCategory('');
        updateParams({ bulk : mode || null, status : null });
    }

    const handleToggle = (id:string) => {
        setSelectedIds((current)=>{
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const handleTogglePage = (ids:string[], checked:boolean) => {
        setSelectedIds((current)=>{
            const next = new Set(current);
            ids.forEach((id)=> checked ? next.add(id) : next.delete(id));
            return next;
        });
    }

    const showBulkSummary = (result:BulkResult) => {
        if (!bulkConfig) return;

        if (result.succeeded.length) {
            toast.success(`${bulkConfig.pastTense} ${pluralise(result.succeeded.length, VIDEO_NOUN)}`);
        }
        if (result.skipped.length) {
            const shown = result.skipped.slice(0, 3).map((item)=>`${item.title || 'Unknown video'}: ${item.reason}`);
            const more = result.skipped.length - shown.length;
            toast.warning(`${pluralise(result.skipped.length, VIDEO_NOUN)} skipped`, {
                description : [...shown, ...(more > 0 ? [`…and ${more} more`] : [])].join('\n'),
            });
        }
    }

    const handleConfirmBulk = () => {
        if (!bulkMode) return;

        const ids = [...selectedIds];
        const emptiesPage = currentPage > 1 && ids.length >= videos.length;

        bulkMutation.mutate({ mode : bulkMode, ids, category : bulkCategory },{
            onSuccess : (result)=>{
                showBulkSummary(result);
                setSelectedIds(new Set());
                setIsBulkConfirmOpen(false);
                if (emptiesPage && result.succeeded.length >= videos.length) {
                    handlePageChange(currentPage - 1);
                }
            },
            onError : (error)=>{
                handleMutationError(error);
                setIsBulkConfirmOpen(false);
            },
        });
    }

    const bulkCategoryName = categoryOptions.find((c)=>c.id === bulkCategory)?.name ?? 'the selected category';
    const bulkConfirmDescription = bulkMode === 'category'
        ? `They will be moved to "${bulkCategoryName}".`
        : bulkMode ? BULK_CONFIRM_DESCRIPTION[bulkMode] : '';

    // ── navigation: remember this filtered list so the form can return to it ──
    const listUrl = `/videos${location.search}`;

    const handleCreate = () => navigate('/videos/new', { state : { returnTo : listUrl } });
    const handleEdit = (video:Video) => navigate(`/videos/${video.id}/edit`, { state : { returnTo : listUrl } });

    const handleEditFromView = (video:Video)=>{
        setVideoToView(null);
        handleEdit(video);
    }

    const handleConfirmDelete = () => {
        if (!videoToDelete) return;
        const isLastItemOnPage = videos.length === 1 && currentPage > 1;

        deleteMutation.mutate(videoToDelete.id,{
            onSuccess : ()=>{
                toast.success('Video deleted successfully');
                if (isLastItemOnPage) handlePageChange(currentPage - 1);
                setVideoToDelete(null);
            },
            onError : (error)=>{
                handleMutationError(error);
                setVideoToDelete(null);
            },
        });
    }

    const renderContent = () => {
        if (isLoading) return <p className="text-sm text-gray-500">Loading videos...</p>;

        if (isError) {
            return (
                <div className="rounded-xl border border-red-100 bg-white px-6 py-10 text-center">
                    <p className="text-sm text-red-600">{error.message || 'Failed to load videos.'}</p>
                    <button
                        type="button"
                        onClick={()=>refetch()}
                        className="mt-4 cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Retry
                    </button>
                </div>
            )
        }

        if (!videos.length) {
            return (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    {bulkConfig ? (
                        <>
                            <h3 className="font-semibold text-gray-900">Nothing to {bulkConfig.label.toLowerCase()}</h3>
                            <p className="mt-1 text-sm text-gray-500">No videos are eligible for this action{hasActiveFilters ? ' with the current filters' : ''}.</p>
                        </>
                    ) : hasActiveFilters ? (
                        <>
                            <h3 className="font-semibold text-gray-900">No videos match your filters</h3>
                            <p className="mt-1 text-sm text-gray-500">Try a different search or clear the filters.</p>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="mt-4 cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Clear filters
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="font-semibold text-gray-900">No videos yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {isAdmin ? 'Videos submitted by contributors will appear here.' : 'Videos you create will appear here.'}
                            </p>
                        </>
                    )}
                </div>
            )
        }

        return (
            <VideoTable
                videos={videos}
                user={user}
                isAdmin={isAdmin}
                isFetching={isFetching}
                selection={bulkConfig ? { selectedIds, onToggle : handleToggle, onTogglePage : handleTogglePage } : null}
                onView={setVideoToView}
                onEdit={handleEdit}
                onDelete={setVideoToDelete}
            />
        )
    }

  return (
    <div className='flex flex-col gap-8'>
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-bold text-2xl sm:text-3xl capitalize">
                {isAdmin ? 'videos' : 'my videos'}
            </h1>

            <div className="flex items-center gap-2">
                {!bulkMode && (
                    <select
                        value=""
                        onChange={(e)=>handleBulkModeChange(e.target.value as BulkMode)}
                        aria-label="Bulk actions"
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-gray-900"
                    >
                        <option value="">Bulk actions…</option>
                        {availableBulkModes.map((mode)=>(
                            <option key={mode} value={mode}>
                                {getBulkModeConfig(mode, isAdmin, VIDEO_NOUN).label}
                            </option>
                        ))}
                    </select>
                )}
                <CreateButton handleCreate={handleCreate} title='create video' />
            </div>
        </div>

        {bulkMode && bulkConfig && (
            <BulkActionBar
                mode={bulkMode}
                config={bulkConfig}
                noun={VIDEO_NOUN}
                selectedCount={selectedIds.size}
                category={bulkCategory}
                onCategoryChange={setBulkCategory}
                onApply={()=>setIsBulkConfirmOpen(true)}
                onExit={()=>handleBulkModeChange('')}
                isBusy={bulkMutation.isPending}
            />
        )}

        <ContentFilters
            noun='Videos'
            isAdmin={isAdmin}
            showStatusFilter={!bulkConfig}
            search={searchInput}
            status={status}
            typeFilter={{
                value : sourceType,
                onChange : (value)=>updateParams({ type : value || null }),
            }}
            categorySlug={categorySlug}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onSearchChange={setSearchInput}
            onStatusChange={(value)=>updateParams({ status : value || null })}
            onCategoryChange={(slug)=>updateParams({ category : slug || null })}
            onDateFromChange={(value)=>updateParams({ from : value || null })}
            onDateToChange={(value)=>updateParams({ to : value || null })}
            onClear={handleClearFilters}
        />

        {renderContent()}

        {!isError && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isFetching}
            />
        )}

        

        {videoToView && (
            <VideoViewModal
                video={videoToView}
                user={user}
                isAdmin={isAdmin}
                onClose={()=>setVideoToView(null)}
                onEdit={handleEditFromView}
            />
        )}

        <ConfirmDialog
            isOpen={!!videoToDelete}
            title='delete video?'
            description={`Are you sure you want to delete "${videoToDelete?.title ?? ''}"? This action cannot be undone.`}
            confirmText='delete video'
            isLoading={deleteMutation.isPending}
            onConfirm={handleConfirmDelete}
            onClose={()=>{ if (!deleteMutation.isPending) setVideoToDelete(null); }}
        />

        {bulkConfig && (
            <ConfirmDialog
                isOpen={isBulkConfirmOpen}
                title={`${bulkConfig.verb} ${pluralise(selectedIds.size, VIDEO_NOUN)}?`}
                description={bulkConfirmDescription}
                confirmText={`${bulkConfig.verb} ${pluralise(selectedIds.size, VIDEO_NOUN)}`}
                loadingText="Working..."
                variant={bulkConfig.danger ? 'danger' : 'default'}
                confirmPhrase={bulkMode === 'delete' ? String(selectedIds.size) : undefined}
                isLoading={bulkMutation.isPending}
                onConfirm={handleConfirmBulk}
                onClose={()=>{ if (!bulkMutation.isPending) setIsBulkConfirmOpen(false); }}
            />
        )}
    </div>
  )
}

export default VideoPage