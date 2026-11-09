import { FileText } from "lucide-react"
import type { Blog } from "../../types/Blogs"
import BlogStatusBadge from "./BlogStatusBadge"
import formatDate from "../../utlis/formatDate"

interface BlogTableProps{
    blogs : Blog[];
    isAdmin : boolean;
    isFetching ? : boolean;
    onView : (blog:Blog) => void;
    onEdit : (blog:Blog) => void;
    onDelete : (blog:Blog) => void;
}

const thClass = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
const tdClass = "px-4 py-3 align-middle"

const BlogTable = ({blogs,isAdmin,isFetching=false,onView,onEdit,onDelete}:BlogTableProps) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity ${isFetching ? 'opacity-60':''}`}>
        <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                <th scope="col" className={`${thClass} text-left capitalize`}>blog</th>
                <th scope="col" className={`${thClass} text-left capitalize hidden lg:flex`}>excerpt</th>
                <th scope="col" className={`${thClass} text-left capitalize`}>category</th>
                {isAdmin && (
                    <th scope="col" className={`${thClass} text-left capitalize`}>contributor</th>
                )}
                <th scope="col" className={`${thClass} text-left capitalize`}>status</th>
                <th scope="col" className={`${thClass} text-left capitalize`}>created</th>
                <th scope="col" className={`${thClass} text-left capitalize`}>actions</th>
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
                {blogs.map((blog)=>(
                    <tr key={blog.id} className="transition hover:bg-gray-50">
                        {/* blog : thumbnail + title + excerpt */}
                        <td className={tdClass}>
                            <div className="flex items-center gap-3">
                                {/* placeholder cover image */}
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                    <FileText size={20} />
                                </div>
                                <div className="min-w-0 max-w-xs">
                                    <div className="truncate capitalize font-medium text-gray-900" title={blog.title}>
                                        {blog.title}
                                    </div>
                                   
                                </div>
                            </div>
                        </td>

                        {/* excerpt */}
                        <td className={`${tdClass} max-w-[250px] hidden lg:table-cell`}>
                             <p className="truncate text-xs text-gray-500">
                                {blog.excerpt || 'No excerpt'}
                            </p>
                        </td>

                        {/* category */}

                        <td className={tdClass}>
                        {blog.category_detail ? (
                            <span className="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                            style={{ backgroundColor : blog.category_detail.color_hex , color:blog.category_detail.text_color_hex }}>
                                {blog.category_detail.name}
                            </span>
                        ) :  (
                            <span className="text-xs text-gray-400 capitalize">uncategorised</span>
                        )}
                        </td>

                        {/* contributor (admin only) */}

                        {isAdmin && (
                            <td className={tdClass}>
                                <span className="whitespace-nowrap capitalize text-gray-700">
                                    {blog.contributor_name}
                                </span>
                            </td>
                        )}

                        {/* status */}

                        <td className={tdClass}>
                            <BlogStatusBadge status={blog.status}  />
                        </td>

                        {/* created */}

                        <td className={tdClass}>
                            <time dateTime={blog.created_at} className="whitespace-nowrap text-gray-600">
                                {formatDate(blog.created_at)}
                            </time>
                        </td>

                        {/* actions */}
                        <td className={`${tdClass} text-right`}>
                            <div className="flex items-center  gap-2">
                                <button type="button" onClick={()=>onView(blog)}
                                 className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 capitalize transition hover:bg-gray-900 hover:text-white">
                                    view
                                </button>

                                <button type="button" onClick={()=>onEdit(blog)}
                                className="cursor-pointer capitalize rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-700 hover:text-white">
                                    edit
                                </button>

                                 <button
                                    type="button"
                                    onClick={()=>onDelete(blog)}
                                    className="cursor-pointer rounded-lg border border-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white"
                                >
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
            
        </table>
      
    </div>
  )
}

export default BlogTable
