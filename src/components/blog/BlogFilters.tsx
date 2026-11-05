import { Search,X } from "lucide-react"
import type { BlogStatus } from "../../types/Blogs"
import { getCategoryOption } from "../../api/categories"
import { BLOG_STATUS_OPTIONS } from "./blogStatus"
import { useCategoryOptions } from "../../hooks/queries/categories";

interface BlogFilterProps{
    search : string;
    status : BlogStatus | '';
    category : string;
    onSearchChange : (value:string) => void;
    onStatusChange : (value : BlogStatus | '') => void;
    onCategoryChange : (value:string) => void;
    onClear : ()=> void
}

const selectClass = 'w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-48'

const BlogFilters = ({search,status,category,onSearchChange,onStatusChange,onCategoryChange,onClear}:BlogFilterProps) => {
    const {data:categories=[],isLoading:categoriesLoading,isError:categoriesError} = useCategoryOptions();
    const hasActiveFilters = Boolean(search || status || category) 
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        {/* search */}
        <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
             type="search"
             value={search}
             onChange={(e)=>onSearchChange(e.target.value)}
             placeholder="Search blogs by title ..."
             aria-label="Search blogs by title"
             className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-900"
            />
        </div>

        {/* status */}
        <select 
            value={status}
            onChange={(e)=>onStatusChange(e.target.value as BlogStatus | '')}
            aria-label="Filter by status"
            className={selectClass}
        >
            <option value="">All statuses</option>
            {BLOG_STATUS_OPTIONS.map((option)=>(
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>

        {/* category */}

        <select 
            value={category}
            onChange={(e)=>onCategoryChange(e.target.value)}
            aria-label="Filter by category"
            className={selectClass}
        >
            <option value="">{categoriesLoading ? 'Loading Categories' : categoriesError ? 'Categories unavailable' : 'All Categories'}</option>
            {categories.map((cat)=>(
                <option key={cat.id} className="capitalize" value={cat.id}>{cat.name}</option>
            ))}
        </select>

        {/* clear */}

        {hasActiveFilters && (
            <button
            type="button"
            onClick={onClear}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
                <X size={14}/> clear
            </button>
        )}
      
    </div>
  )
}

export default BlogFilters
