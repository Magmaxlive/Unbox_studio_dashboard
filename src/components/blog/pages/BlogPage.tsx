import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import CreateButton from '../../ui/CreateButton'
import UseDebounce from '../../../hooks/UseDebounce'
import BlogFilters from '../BlogFilters'
import Pagination from '../../ui/Pagination'
import type { Blog, BlogFilter,BlogStatus } from '../../../types/Blogs'
import { useBlogs,useDeleteBlog } from '../../../hooks/queries/blogs'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { handleMutationError } from '../../../utlis/handleMutationError'
import BlogTable from '../BlogTable'
import ConfirmDialog from '../../ui/ConfirmDialog'
import BlogViewModal from '../BlogViewModal'
import { startOfLocalDayISO,startOfNextLocalDayISO } from '../../../utlis/dateRange'

const PAGE_SIZE = 12

// URL values can be edited by hand or come from old bookmarks: validate them.
const BLOG_STAUSES : BlogStatus[] = ['draft','pending','published','rejected','archived']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;   // Django SlugField characters

interface UpdateParamsOptions {
    // any filter change returns to page 1
    resetPage ? : boolean;
    // replace the current history entry instead of adding one
    replace ? : boolean;
}

const BlogPage = () => {
    const {user} = useAuth()
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();
    const location = useLocation();

    // filters live in the url
    const [searchParams,setSearchParams] = useSearchParams();

    const pageParam = Number(searchParams.get('page'));
    const currentPage = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

    const statusParam = searchParams.get('status') ?? '';
    const status : BlogStatus | '' = BLOG_STAUSES.includes(statusParam as BlogStatus)
        ? statusParam as BlogStatus
        : '';

    const categoryParam = searchParams.get('category') ?? '';
    const categorySlug = SLUG_PATTERN.test(categoryParam) ? categoryParam : '';

    const fromParam = searchParams.get('from') ?? '';
    const toParam = searchParams.get('to') ?? '';
    const dateFrom = isAdmin && DATE_PATTERN.test(fromParam) ? fromParam : '';   // "YYYY-MM-DD"
    const dateTo = isAdmin && DATE_PATTERN.test(toParam) ? toParam : '';         // "YYYY-MM-DD"

    const urlSearch = (searchParams.get('search') ?? '').trim();

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


    
    const [searchInput,setSearchInput] = useState('')
    // debounced search value reached API
    const debouncedSearch = UseDebounce(searchInput.trim())

        // typing → URL (replace: no history entry per keystroke pause)

    useEffect(()=>{
        if (debouncedSearch !== urlSearch){
            updateParams({search : debouncedSearch || null}, {replace : true})
        }
    },[debouncedSearch])

    useEffect(()=>{
        if (urlSearch !== searchInput.trim()){
            setSearchInput(urlSearch)
        }
    },[urlSearch])
    

    // delete state
    const [blogToDelete,setBlogToDelete] = useState<Blog | null>(null);
    const [blogToView,setBlogToView] = useState<Blog | null>(null);

    

    // build filters with only the values that are actually set
    const filters : BlogFilter = {page:currentPage};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (status) filters.status = status;
    if (categorySlug) filters.category_slug = categorySlug;

    // date range : converted to timestamp in viewers timezone
    if (isAdmin && dateFrom){
        const createdAfter = startOfLocalDayISO(dateFrom)
        if (createdAfter) filters.created_after = createdAfter
    }

    if (isAdmin && dateTo){
        const createdBefore = startOfNextLocalDayISO(dateTo)
        if (createdBefore) filters.created_before = createdBefore
    }

    const {
        data,isLoading,refetch,isFetching,error,isError
    } = useBlogs(filters)

    const deleteMutation = useDeleteBlog()

    const blogs = data?.results ?? []
    const totalCount = data?.count ?? 0;
    const totalPages = Math.ceil(totalCount/PAGE_SIZE);

        const hasActiveFilters = Boolean(urlSearch || status || categorySlug || dateFrom || dateTo);

    // ── navigation: remember this filtered list so the editor can return to it ──
    const listUrl = `/blogs${location.search}`;

    // handles every filter change return to page 1
    const handlePageChange = (page:number) => {
        updateParams({ page : page > 1 ? String(page) : null }, { resetPage : false });
    }

    const handleCreate = ()=>{
        navigate('/blogs/new/',{state : {returnTo : listUrl}})
    }

    const handleStatusChange = (value:BlogStatus | '')=>{
        updateParams({status : value || null});
    }

    const handleCategoryChange = (slug:string) => {
        updateParams({category : slug || null});
    }

    const handleDateFromChange = (value:string) =>{
        updateParams({from : value || null});
    }

    const handleDateToChange = (value:string) =>{
        updateParams({to : value || null});
    }

    const handleView = (blog:Blog)=>{
        setBlogToView(blog)
    }

    const handleEdit = (blog:Blog)=>{
        navigate(`/blogs/${blog.id}/edit`,{state : {returnTo : listUrl}})
    }

    const handleEditFromView = (blog:Blog)=>{
        setBlogToView(null)
        handleEdit(blog)
    }

    const handleDelete = (blog:Blog) =>{
        setBlogToDelete(blog)
    }

    const handleCloseDelete = ()=>{
        if (deleteMutation.isPending) return;
        setBlogToDelete(null)
    }

    const handleConfirmDelete = ()=>{
        if (!blogToDelete) return;

        const isLastitemOnPage = blogs.length === 1 && currentPage > 1;
        deleteMutation.mutate(blogToDelete.id,{
            onSuccess : () => {
                toast.success('Blog deleted successfully');
                if(isLastitemOnPage){
                    handlePageChange(currentPage - 1);
                }
                setBlogToDelete(null)
            },
            onError : (error)=>{
                handleMutationError(error)
                setBlogToDelete(null)
            }
        })
    }

    // clear filters
    const handleClearFilters = () =>{
        setSearchInput('');
        setSearchParams(new URLSearchParams());
    }

// result area
    const renderContent = () =>{
        if (isLoading) {
            return <p className="text-sm text-gray-500 captilaize">loading blogs...</p>
        }

        if (isError){
            return(
                <div className="rounded-xl border border-red-100 bg-white px-6 py-10 text-center">
                    <p className="text-sm text-red-600">{error.message || 'Failed to load blogs.'}</p>
                    <button type='button' onClick={()=>refetch()} className="mt-4 cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Retry
                    </button>
                </div>
            )
        }

        if (!blogs.length){
            return(
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    {hasActiveFilters ? (
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-gray-900">No blogs match your filters</h3>
                            <p className="text-sm text-gray-500">Try a different search or clear</p>
                            <button type='button' onClick={()=>handleClearFilters()} className='cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'>
                                Clear filter
                            </button>
                        </div>
                    ):(
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-gray-900">No blogs yet</h3>
                            <p className="text-sm text-gray-500">
                                {isAdmin ? 'Blogs submitted by contributors will appear here' : 'Blogs you create will appear here'}
                            </p>
                        </div>
                    )}
                </div>
            )
        }

        // table
        return(
           <BlogTable
            onDelete={handleDelete}
            user = {user}
            onView={handleView}
            onEdit={handleEdit}
            blogs={blogs}
            isAdmin={isAdmin}
            isFetching={isFetching}
           />
        )
    }

  return (
    <div className='flex flex-col gap-4'>
        <div className="justify-between flex items-center">
            <h1 className="font-bold text-2xl sm:text-3xl capitalize">{isAdmin ? 'blogs' : 'my blogs'}</h1>
            <CreateButton title='create blog' handleCreate={handleCreate}/>
        </div>

        <BlogFilters
            search={searchInput}
            categorySlug={categorySlug}
            status={status}
            onCategoryChange={handleCategoryChange}
            onSearchChange={setSearchInput}
            onStatusChange={handleStatusChange}
            onClear={handleClearFilters}
            isAdmin={isAdmin}
            dateFrom={dateFrom}
            onDateFromChange={handleDateFromChange}
            dateTo={dateTo}
            onDateToChange={handleDateToChange}
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
                user = {user}
                isAdmin={isAdmin}
                onClose={()=>setBlogToView(null)}
                onEdit={handleEditFromView}
            />
        )}

        <ConfirmDialog
            description={`Are you sure you want to delete ${blogToDelete?.title?? ''} ? This action cannot be undone`}
            title='Delete blog ?'
            isOpen={!!blogToDelete}
            confirmText='delete blog'
            isLoading={deleteMutation.isPending}
            onConfirm={handleConfirmDelete}
            onClose={handleCloseDelete}
        />
    </div>
  )
}

export default BlogPage
