import { ArrowRight, CalendarDays, Search, X } from "lucide-react"
import type { BlogStatus } from "../../types/Blogs"
import type { VideoSourceType } from "../../types/Videos"
import { BLOG_STATUS_OPTIONS } from "../blog/blogStatus"
import { useCategoryOptions } from "../../hooks/queries/categories"
import { todayInputValue } from "../../utlis/dateRange"

interface TypeFilter {
    value : VideoSourceType | '';
    onChange : (value:VideoSourceType | '') => void;
}

interface ContentFiltersProps {
    noun : string;                 // "blogs", "videos": used in the search placeholder
    isAdmin : boolean;
    showStatusFilter? : boolean;   // hidden in bulk mode (the mode decides statuses)
    typeFilter? : TypeFilter;      // videos only: uploads / embeds
    search : string;
    status : BlogStatus | '';
    categorySlug : string;
    dateFrom : string;
    dateTo : string;
    onSearchChange : (value:string) => void;
    onStatusChange : (value:BlogStatus | '') => void;
    onCategoryChange : (value:string) => void;
    onDateFromChange : (value:string) => void;
    onDateToChange : (value:string) => void;
    onClear : () => void;
}

// one height and border style for every control
const controlClass = 'h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-gray-900'
const selectClass = `${controlClass} w-full cursor-pointer px-3 sm:w-44`
const dateClass = 'h-full min-w-0 flex-1 cursor-pointer bg-transparent px-2 text-sm text-gray-700 outline-none sm:w-36 sm:flex-none'

const ContentFilters = ({
    noun,
    isAdmin,
    showStatusFilter = true,
    typeFilter,
    search,
    status,
    categorySlug,
    dateFrom,
    dateTo,
    onSearchChange,
    onStatusChange,
    onCategoryChange,
    onDateFromChange,
    onDateToChange,
    onClear,
}:ContentFiltersProps) => {
    const today = todayInputValue();
    const { data:categories = [], isLoading:categoriesLoading, isError:categoriesError } = useCategoryOptions();

    const searchLabel = isAdmin
        ? `Search ${noun} by title or contributor…`
        : `Search ${noun} by title…`;

    const hasActiveFilters = Boolean(
        search
        || (showStatusFilter && status)
        || typeFilter?.value
        || categorySlug
        || dateFrom
        || dateTo
    );

  return (
    // one row that wraps onto more lines when space runs out
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* search: grows to fill spare space, never narrower than 16rem */}
        <div className="relative w-full sm:w-auto sm:min-w-64 sm:flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="search"
                value={search}
                onChange={(e)=>onSearchChange(e.target.value)}
                placeholder={searchLabel}
                aria-label={searchLabel}
                className={`${controlClass} w-full pl-9 pr-3 placeholder:text-gray-400`}
            />
        </div>

        {showStatusFilter && (
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
        )}

        {typeFilter && (
            <select
                value={typeFilter.value}
                onChange={(e)=>typeFilter.onChange(e.target.value as VideoSourceType | '')}
                aria-label="Filter by type"
                className={selectClass}
            >
                <option value="">All types</option>
                <option value="upload">Uploads</option>
                <option value="embed">Embeds</option>
            </select>
        )}

        <select
            value={categorySlug}
            onChange={(e)=>onCategoryChange(e.target.value)}
            aria-label="Filter by category"
            className={`${selectClass} capitalize`}
        >
            <option value="">
                {categoriesLoading ? 'Loading categories…' : categoriesError ? 'Categories unavailable' : 'All categories'}
            </option>
            {categories.map((cat)=>(
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
        </select>

        {/* date range (admins): one joined control */}
        {isAdmin && (
            <div
                className="flex h-10 w-full items-center rounded-lg border border-gray-200 bg-white pl-3 transition focus-within:border-gray-900 hover:border-gray-300 sm:w-auto"
                title="Created between"
            >
                <CalendarDays size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
                <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || today}
                    onChange={(e)=>onDateFromChange(e.target.value)}
                    aria-label="Created from"
                    className={dateClass}
                />
                <ArrowRight size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
                <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    max={today}
                    onChange={(e)=>onDateToChange(e.target.value)}
                    aria-label="Created to"
                    className={dateClass}
                />
            </div>
        )}

        {hasActiveFilters && (
            <button
                type="button"
                onClick={onClear}
                className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-white bg-gray-500 transition hover:bg-gray-100 hover:bg-gray-900"
            >
                <X size={14}/> Clear filters
            </button>
        )}
    </div>
  )
}

export default ContentFilters