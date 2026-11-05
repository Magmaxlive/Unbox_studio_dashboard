import { useAuth } from '../../../contexts/AuthContext'
import CreateButton from '../../ui/CreateButton'

const BlogPage = () => {
    const {user} = useAuth()
    const isAdmin = user?.role === 'admin'
  return (
    <div className='flex flex-col gap-2'>
        <div className="justify-between flex items-center">
            <h1 className="font-bold text-2xl sm:text-3xl capitalize">{isAdmin ? 'blogs' : 'my blogs'}</h1>
            <CreateButton title='create blog'/>
        </div>
      
    </div>
  )
}

export default BlogPage
