import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import CreateButton from '../../ui/CreateButton'
import BlogStatusBadge from '../BlogStatusBadge'
import UseDebounce from '../../../hooks/UseDebounce'
import type { BlogStatus } from '../../../types/Blogs'
import BlogFilters from '../BlogFilters'


const BlogPage = () => {
    const {user} = useAuth()
    const isAdmin = user?.role === 'admin'
    const [search,setSearch] = useState('')
    const [status,setStatus] = useState<BlogStatus | ''>('')
    const [category,setCategory] = useState('')
    const debouncedSearch = UseDebounce(search)

  return (
    <div className='flex flex-col gap-4'>
        <div className="justify-between flex items-center">
            <h1 className="font-bold text-2xl sm:text-3xl capitalize">{isAdmin ? 'blogs' : 'my blogs'}</h1>
            <CreateButton title='create blog'/>
        </div>

        <BlogFilters
            search={search}
            category={category}
            status={status}
            onCategoryChange={setCategory}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onClear={()=>{setSearch('');setCategory('');setStatus('')}}
        />
        <pre className="text-xs">{JSON.stringify({search,debouncedSearch,status,category},null,2)}</pre>
      
    </div>
  )
}

export default BlogPage
