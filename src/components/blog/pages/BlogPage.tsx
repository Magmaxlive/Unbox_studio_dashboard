import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import CreateButton from '../../ui/CreateButton'
import UseDebounce from '../../../hooks/UseDebounce'
import BlogFilters from '../BlogFilters'
import Pagination from '../../ui/Pagination'
import type { Blog, BlogFilter,BlogStatus } from '../../../types/Blogs'
import { useBlogs,useDeleteBlog } from '../../../hooks/queries/blogs'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { handleMutationError } from '../../../utlis/handleMutationError'
import BlogTable from '../BlogTable'
import ConfirmDialog from '../../ui/ConfirmDialog'
import BlogViewModal from '../BlogViewModal'
import { startOfLocalDayISO,startOfNextLocalDayISO } from '../../../utlis/dateRange'


const PAGE_SIZE = 12

const BlogPage = () => {
    const {user} = useAuth()
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();

    // filter + pagination states
    const [currentPage,setCurrentPage] = useState(1)
    const [searchInput,setSearchInput] = useState('')
    const [status,setStatus] = useState<BlogStatus | ''>('')
    const [category,setCategory] = useState('')
    const [dateFrom,setDateFrom] = useState('')
    const [dateTo,setDateTo] = useState('')

    // delete state
    const [blogToDelete,setBlogToDelete] = useState<Blog | null>(null);
    const [blogToView,setBlogToView] = useState<Blog | null>(null);

    // debounced search value reached API
    const debouncedSearch = UseDebounce(searchInput.trim())

    // build filters with only the values that are actually set
    const filters : BlogFilter = {page:currentPage};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (status) filters.status = status;
    if (category) filters.category = category;

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

    const hasActiveFilters = Boolean(debouncedSearch || status || category)

    // handles every filter change return to page 1
    const handleSearchChange = (value:string)=>{
        setSearchInput(value);
        setCurrentPage(1)
    }

    const handleCreate = ()=>{
        navigate('/blogs/new/')
    }

    const handleStatusChange = (value:BlogStatus | '')=>{
        setStatus(value);
        setCurrentPage(1)
    }

    const handleCategoryChange = (value:string) => {
        setCategory(value);
        setCurrentPage(1)
    }

    const handleDateFromChange = (value:string) =>{
        setDateFrom(value);
        setCurrentPage(1)
    }

    const handleDateToChange = (value:string) =>{
        setDateTo(value);
        setCurrentPage(1)
    }

    const handleView = (blog:Blog)=>{
        setBlogToView(blog)
    }

    const handleEdit = (blog:Blog)=>{
        navigate(`/blogs/${blog.id}/edit`)
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
                    setCurrentPage((page)=>page-1)
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
        setStatus('');
        setCategory('');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
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
            category={category}
            status={status}
            onCategoryChange={handleCategoryChange}
            onSearchChange={handleSearchChange}
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
                onPageChange={setCurrentPage}
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
