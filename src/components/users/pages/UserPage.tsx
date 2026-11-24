
import CreateButton from '../../ui/CreateButton'
import UsersTable from '../UsersTable'
import type { User,UserFilter,UserRole } from '../../../types/Users'
import Pagination from '../../ui/Pagination'
import { useEffect,useState } from 'react'
import { useUsers } from '../../../hooks/queries/users'
import { replace, useLocation, useSearchParams } from 'react-router-dom'
import UseDebounce from '../../../hooks/UseDebounce'
import UserFilters from '../UserFilters'

const PAGE_SIZE = 12
const USER_ROLES : UserRole[] = ['admin','contributor']

interface UpdateParamsOptions {
    // any filter change returns to page 1
    resetPage ? : boolean;
    // replace the current history entry instead of adding one
    replace ? : boolean;
}


const UserPage = () => {
    const [searchParms,setSearchParams] = useSearchParams();
    const location = useLocation();
    const pageParam = Number(searchParms.get('page'))
    const currentPage = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

    const roleParam = searchParms.get('role') ?? '';
    const role : UserRole | '' = USER_ROLES.includes(roleParam as UserRole)
    ? roleParam as UserRole
    : '';

    
    const urlsearch = (searchParms.get('search') ?? '').trim();

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
    // debounced search
    const debouncedSearch = UseDebounce(searchInput.trim())

    // typing - url
    useEffect(()=>{
        if (debouncedSearch !== urlsearch){
            updateParams({search : debouncedSearch || null},{replace:true})
        }
    },[debouncedSearch])

    useEffect(()=>{
        if (urlsearch !== searchInput.trim()){
            setSearchInput(urlsearch)
        }
    },[urlsearch])

    const filters : UserFilter = {page:currentPage};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (role) filters.role = role;
    

    const {data,isLoading,isFetching,error,isError,refetch} = useUsers(filters)

    const users = data?.results ?? []
    const totalCount = data?.count ?? 0;
    const totalPages = Math.ceil(totalCount/PAGE_SIZE);

    const listUrl = `/admin/users${location.search}`

    const hasActiveFilters = Boolean(urlsearch)
    const handlePageChage = (page:number) =>{
        updateParams({page : page > 1 ? String(page) : null},{resetPage:false})
    }

    const handleRoleChange = (value:UserRole | '')=>{
        updateParams({role:value || null});
    }

    // clear filters
     const handleClearFilters = () =>{
        setSearchInput('');
        setSearchParams(new URLSearchParams());
    }

    // result area
    const renderContent = () => {
        if (isLoading){
            return  <p className="text-sm text-gray-500 captilaize">loading users...</p>
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

        if (!users.length){
            return(
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    {hasActiveFilters ? (
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-gray-900">No user match your filters</h3>
                            <p className="text-sm text-gray-500">Try a different search or clear</p>
                            <button type='button' onClick={()=>handleClearFilters()} className='cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'>
                                Clear filter
                            </button>
                        </div>
                    ):(
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-gray-900">No users yet</h3>
                            <p className="text-sm text-gray-500">
                                All users will appear here
                            </p>
                        </div>
                    )}
                </div>
            )
    }

    return (
        <UsersTable users={users} isFetching={isFetching}  />
    )
}

  return (
    <div className='flex flex-col gap-3'>
        <div className="flex justify-between items-center">
            <h1 className="font-semibold text-2xl sm:text-3xl capitalize">users</h1>
            <CreateButton title='add users' />
        </div>

        <UserFilters
            search={searchInput}
            role={role}
            onRoleChange={handleRoleChange}
            onSearchChange={setSearchInput}
            onClear={handleClearFilters}
        />
        
        {renderContent()}

        {!isError && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChage}
                isLoading={isFetching}
            />
        )
        }
      
    </div>
  )
}

export default UserPage
