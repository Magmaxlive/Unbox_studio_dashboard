import { Link,useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const BlogFormPage = () => {
    const {id} = useParams<{id:string}>();
    const isEditing = Boolean(id);

  return (
    <div className="flex flex-col gap-6">
      <Link to='/blogs' className="flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900">
        <ArrowLeft size={16}/> Back to blogs
      </Link>

      <h1 className="font-bold text-2xl sm:text-3xl capitalize">
        {isEditing ? 'edit blog' : 'create blog'}
      </h1>

      <p className="text-sm text-gray-500">
        {isEditing ? `Editing blog ${id}` : 'New blog'}
      </p>
    </div>
  )
}

export default BlogFormPage
