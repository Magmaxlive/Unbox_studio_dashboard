import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import CreateButton from '../../ui/CreateButton'
import BlogStatusBadge from '../BlogStatusBadge'
import UseDebounce from '../../../hooks/UseDebounce'
import BlogFilters from '../BlogFilters'
import Pagination from '../../ui/Pagination'
import type { BlogFilter,BlogStatus } from '../../../types/Blogs'
import { useBlogs } from '../../../hooks/queries/blogs'

const PAGE_SIZE = 12

const BlogPage = () => {
    const {user} = useAuth()
    const isAdmin = user?.role === 'admin';

    // filter + pagination states
    const [currentPage,setCurrentPage] = useState(1)
    const [searchInput,setSearchInput] = useState('')
    const [status,setStatus] = useState<BlogStatus | ''>('')
    const [category,setCategory] = useState('')

    // debounced search value reached API
    const debouncedSearch = UseDebounce(searchInput.trim())

    // build filters with only the values that are actually set
    const filters : BlogFilter = {page:currentPage};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (status) filters.status = status;
    if (category) filters.category = category;

    const {
        data,isLoading,refetch,isFetching,error,isError
    } = useBlogs(filters)

    const blogs = data?.results ?? []
    const totalCount = data?.count ?? 0;
    const totalPages = Math.ceil(totalCount/PAGE_SIZE);

    const hasActiveFilters = Boolean(debouncedSearch || status || category)

    // handles every filter change return to page 1
    const handleSearchChange = (value:string)=>{
        setSearchInput(value);
        setCurrentPage(1)
    }

    const handleStatusChange = (value:BlogStatus | '')=>{
        setStatus(value);
        setCurrentPage(1)
    }

    const handleCategoryChange = (value:string) => {
        setCategory(value);
        setCurrentPage(1)
    }

    // clear filters
    const handleClearFilters = () =>{
        setSearchInput('');
        setStatus('');
        setCategory('');
        setCurrentPage(1)
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
            <ul className={`divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                {blogs.map((blog)=>(
                    <li key={blog.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900 capitalize">{blog.title}</p>
                            <p className="text-xs text-gray-500 capitalize">
                                {blog.category_detail?.name ?? 'uncategorised'}
                                {isAdmin && `- ${blog.contributor_name}` }
                            </p>
                        </div>
                        <BlogStatusBadge status={blog.status} />
                    </li>
                ))}

            </ul>
        )
    }

  return (
    <div className='flex flex-col gap-4'>
        <div className="justify-between flex items-center">
            <h1 className="font-bold text-2xl sm:text-3xl capitalize">{isAdmin ? 'blogs' : 'my blogs'}</h1>
            <CreateButton title='create blog'/>
        </div>

        <BlogFilters
            search={searchInput}
            category={category}
            status={status}
            onCategoryChange={handleCategoryChange}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onClear={handleClearFilters}
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
    </div>
  )
}

export default BlogPage
