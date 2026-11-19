import { Search,X } from "lucide-react"
import type { UserRole } from "../../../types/Users";
import { USER_ROLE_CONFIG, USER_ROLE_OPTIONS } from "./userRole";

interface UserFilterProps{
    search : string;
    role : UserRole | '';
    onSearchChange : (value:string)=>void;
    onRoleChange : (value:UserRole | '')=>void;
    onClear : ()=>void;
}

const selectClass = 'w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-48'
// const dateInputClass = "w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-900 sm:w-44"

const UserFilters = ({search,role,onClear,onRoleChange,onSearchChange}:UserFilterProps) => {
    const hasActiveFilters = Boolean(search || role)
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row gap-3">
            {/* search */}
            <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e)=>onSearchChange(e.target.value)}
                    placeholder="Search by user's name or email"
                    aria-label="Search by user's name or email"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-900"
                />
            </div>
            {/* role */}
            <select
                value={role}
                onChange={(e)=>onRoleChange(e.target.value as UserRole)}
                aria-label="Filter by status"
                className={selectClass}
            >
                <option value="">All roles</option>
                {USER_ROLE_OPTIONS.map((option)=>(
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}

            </select>

            {/* clear */}

            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={onClear}
                    className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                    <X size={14} /> clear
                </button>
            )}
        </div>
      
    </div>
  )
}

export default UserFilters
