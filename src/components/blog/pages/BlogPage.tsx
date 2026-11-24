import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { Blog, BlogFilter, BlogStatus, BulkResult } from '../../../types/Blogs'
import { useBlogBulkAction, useBlogs, useDeleteBlog } from '../../../hooks/queries/blogs'
import { useCategoryOptions } from '../../../hooks/queries/categories'
import UseDebounce from '../../../hooks/UseDebounce'
import { useAuth } from '../../../contexts/AuthContext'
import { handleMutationError } from '../../../utlis/handleMutationError'
import { startOfLocalDayISO, startOfNextLocalDayISO } from '../../../utlis/dateRange'
import { isAxiosError } from 'axios'
import BlogTable from '../BlogTable'
import BlogViewModal from '../BlogViewModal'
import BulkActionBar from '../../bulk/BulkActionBar'
import Pagination from '../../ui/Pagination'
import ConfirmDialog from '../../ui/ConfirmDialog'
import CreateButton from '../../ui/CreateButton'
import {
    getAvailableBulkModes,
    getBulkModeConfig,
    BLOG_NOUN,
    pluralise,
    type BulkMode,
} from '../../bulk/bulkActions'
import ContentFilters from '../../filters/ContentFilter'

const PAGE_SIZE = 12;
const BULK_PAGE_SIZE = 20;

// URL values can be edited by hand or come from old bookmarks: validate them.
const BLOG_STATUSES : BlogStatus[] = ['draft', 'pending', 'published', 'rejected', 'archived'];
const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;   // Django SlugField characters
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface UpdateParamsOptions {
    resetPage? : boolean;
    replace? : boolean;
}

const BULK_CONFIRM_DESCRIPTION : Record<BulkMode, string> = {
    archive : 'They will be removed from the public website. You can restore them later.',
    restore : 'They will be visible on the public website again.',
    category : '',  // filled in with the destination name
    delete : 'They will be permanently deleted. This cannot be undone.',
};

const BlogPage = () => {
    const {user} = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();
    const location = useLocation();

    // ── filters + bulk mode live in the URL ──
    const [searchParams,setSearchParams] = useSearchParams();

    const pageParam = Number(searchParams.get('page'));
    const currentPage = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

    const statusParam = searchParams.get('status') ?? '';
    const status : BlogStatus | '' = BLOG_STATUSES.includes(statusParam as BlogStatus)
        ? statusParam as BlogStatus
        : '';

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
    const bulkConfig = bulkMode ? getBulkModeConfig(bulkMode, isAdmin,BLOG_NOUN) : null;

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
        if (urlSearch !== searchInput.trim()) {
            setSearchInput(urlSearch);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[urlSearch])

    // ── bulk selection (cleared whenever the URL changes: filters, page, mode) ──
    const [selectedIds,setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkCategory,setBulkCategory] = useState('');
    const [isBulkConfirmOpen,setIsBulkConfirmOpen] = useState(false);

    useEffect(()=>{
        setSelectedIds(new Set());
    },[location.search])

    // view + delete state (not part of the URL)
    const [blogToView,setBlogToView] = useState<Blog | null>(null);
    const [blogToDelete,setBlogToDelete] = useState<Blog | null>(null);

    // ── API filters ──
    const filters : BlogFilter = { page : currentPage };
    if (urlSearch) filters.search = urlSearch;
    if (categorySlug) filters.category_slug = categorySlug;

    if (bulkConfig) {
        // bulk mode decides the statuses: only eligible items are listed
        filters.status_in = bulkConfig.statuses.join(',');
        filters.page_size = BULK_PAGE_SIZE
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

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useBlogs(filters);

        // this page stopped existing (items moved out of the list): step back, quietly
    const pageGone = currentPage > 1 && isError && isAxiosError(error) && error.response?.status === 404;

    useEffect(()=>{
        if (pageGone) {
            updateParams(
                { page : currentPage > 2 ? String(currentPage - 1) : null },
                { resetPage : false, replace : true },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[pageGone, currentPage])

     useEffect(()=>{
        const pageGone = isError && isAxiosError(error) && error.response?.status === 404;
        if (currentPage > 1 && pageGone) {
            updateParams(
                { page : currentPage > 2 ? String(currentPage - 1) : null },
                { resetPage : false, replace : true },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[isError, error, currentPage])

    const deleteMutation = useDeleteBlog();
    const bulkMutation = useBlogBulkAction();
    const { data:categoryOptions = [] } = useCategoryOptions();

    const blogs = data?.results ?? [];
    const totalCount = data?.count ?? 0;
    const pageSize = bulkConfig ? BULK_PAGE_SIZE : PAGE_SIZE;
    const totalPages = Math.ceil(totalCount / pageSize);

    const hasActiveFilters = Boolean(urlSearch || (!bulkConfig && status) || categorySlug || dateFrom || dateTo);

    // ── filter handlers ──
    const handleStatusChange = (value:BlogStatus | '') => {
        updateParams({ status : value || null });
    }

    const handleCategoryChange = (slug:string) => {
        updateParams({ category : slug || null });
    }

    const handleDateFromChange = (value:string) => {
        updateParams({ from : value || null });
    }

    const handleDateToChange = (value:string) => {
        updateParams({ to : value || null });
    }

    const handlePageChange = (page:number) => {
        updateParams({ page : page > 1 ? String(page) : null }, { resetPage : false });
    }

    const handleClearFilters = () => {
        setSearchInput('');
        const next = new URLSearchParams();
        if (bulkMode) next.set('bulk', bulkMode);   // stay in bulk mode
        setSearchParams(next);
    }

    // ── bulk mode ──
    const handleBulkModeChange = (mode:BulkMode | '') => {
        setBulkCategory('');
        // entering a mode: the mode decides statuses, so drop the status filter
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
            toast.success(`${bulkConfig.pastTense} ${pluralise(result.succeeded.length,BLOG_NOUN)}`);
        }

        if (result.skipped.length) {
            const shown = result.skipped.slice(0, 3)
                .map((item)=>`${item.title || 'Unknown blog'}: ${item.reason}`);
            const more = result.skipped.length - shown.length;
            toast.warning(`${pluralise(result.skipped.length,BLOG_NOUN)} skipped`, {
                description : [...shown, ...(more > 0 ? [`…and ${more} more`] : [])].join('\n'),
            });
        }
    }

    const handleConfirmBulk = () => {
        if (!bulkMode) return;

        const ids = [...selectedIds];
        

        bulkMutation.mutate({ mode : bulkMode, ids, category : bulkCategory },{
            onSuccess : (result)=>{
                showBulkSummary(result);
                setSelectedIds(new Set());
                setIsBulkConfirmOpen(false);
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

    // ── navigation: remember this filtered list so the editor can return to it ──
    const listUrl = `/blogs${location.search}`;

    const handleCreate = () => {
        navigate('/blogs/new', { state : { returnTo : listUrl } });
    }

    const handleEdit = (blog:Blog) => {
        navigate(`/blogs/${blog.id}/edit`, { state : { returnTo : listUrl } });
    }

    const handleView = (blog:Blog) => {
        setBlogToView(blog);
    }

    const handleEditFromView = (blog:Blog) => {
        setBlogToView(null);
        handleEdit(blog);
    }

    const handleDelete = (blog:Blog) => {
        setBlogToDelete(blog);
    }

    const handleCloseDelete = () => {
        if (deleteMutation.isPending) return;
        setBlogToDelete(null);
    }

    const handleConfirmDelete = () => {
        if (!blogToDelete) return;

        

        deleteMutation.mutate(blogToDelete.id,{
            onSuccess : ()=>{
                toast.success('Blog deleted successfully');
                setBlogToDelete(null);
            },
            onError : (error)=>{
                handleMutationError(error);
                setBlogToDelete(null);
            }
        })
    }

    // results area (toolbar stays mounted in every state)
    const renderContent = () => {
        if (isLoading || pageGone) {
            return <p className="text-sm text-gray-500">Loading blogs...</p>
        }

        if (isError) {
            return (
                <div className="rounded-xl border border-red-100 bg-white px-6 py-10 text-center">
                    <p className="text-sm text-red-600">{error.message || 'Failed to load blogs.'}</p>
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

        if (!blogs.length) {
            return (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    {bulkConfig ? (
                        <>
                            <h3 className="font-semibold text-gray-900">Nothing to {bulkConfig.label.toLowerCase()}</h3>
                            <p className="mt-1 text-sm text-gray-500">No blogs are eligible for this action{hasActiveFilters ? ' with the current filters' : ''}.</p>
                        </>
                    ) : hasActiveFilters ? (
                        <>
                            <h3 className="font-semibold text-gray-900">No blogs match your filters</h3>
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
                            <h3 className="font-semibold text-gray-900">No blogs yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {isAdmin ? 'Blogs submitted by contributors will appear here.' : 'Blogs you create will appear here.'}
                            </p>
                        </>
                    )}
                </div>
            )
        }

        return (
            <BlogTable
                blogs={blogs}
                user={user}
                isAdmin={isAdmin}
                isFetching={isFetching}
                selection={bulkConfig ? {
                    selectedIds,
                    onToggle : handleToggle,
                    onTogglePage : handleTogglePage,
                } : null}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        )
    }

  return (
    <div className='flex flex-col gap-8'>
        <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-bold text-2xl sm:text-3xl capitalize">
                {isAdmin ? 'blogs' : 'my blogs'}
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
                                {getBulkModeConfig(mode, isAdmin,BLOG_NOUN).label}
                            </option>
                        ))}
                    </select>
                )}
                <CreateButton handleCreate={handleCreate} title='create blog' />
            </div>
        </div>

        {bulkMode && bulkConfig && (
            <BulkActionBar
                mode={bulkMode}
                config={bulkConfig}
                selectedCount={selectedIds.size}
                category={bulkCategory}
                onCategoryChange={setBulkCategory}
                onApply={()=>setIsBulkConfirmOpen(true)}
                onExit={()=>handleBulkModeChange('')}
                isBusy={bulkMutation.isPending}
                noun={BLOG_NOUN}
            />
        )}

        <ContentFilters
            noun='blogs'
            isAdmin={isAdmin}
            showStatusFilter={!bulkConfig}
            search={searchInput}
            status={status}
            categorySlug={categorySlug}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onSearchChange={setSearchInput}
            onStatusChange={handleStatusChange}
            onCategoryChange={handleCategoryChange}
            onDateFromChange={handleDateFromChange}
            onDateToChange={handleDateToChange}
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

        {blogToView && (
            <BlogViewModal
                blog={blogToView}
                user={user}
                isAdmin={isAdmin}
                onClose={()=>setBlogToView(null)}
                onEdit={handleEditFromView}
            />
        )}

        <ConfirmDialog
            isOpen={!!blogToDelete}
            title='delete blog?'
            description={`Are you sure you want to delete "${blogToDelete?.title ?? ''}"? This action cannot be undone.`}
            confirmText='delete blog'
            isLoading={deleteMutation.isPending}
            onConfirm={handleConfirmDelete}
            onClose={handleCloseDelete}
        />

        {bulkConfig && (
            <ConfirmDialog
                isOpen={isBulkConfirmOpen}
                title={`${bulkConfig.verb} ${pluralise(selectedIds.size,BLOG_NOUN)}?`}
                description={bulkConfirmDescription}
                confirmText={`${bulkConfig.verb} ${pluralise(selectedIds.size,BLOG_NOUN)}`}
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

export default BlogPage