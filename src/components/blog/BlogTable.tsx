import { FileText } from "lucide-react"
import type { Blog } from "../../types/Blogs"
import BlogStatusBadge from "./BlogStatusBadge"
import formatDate from "../../utlis/formatDate"
import BlogCategoryBadge from "./BlogCategoryBadge"
import { getEditBlockedReason,getDeleteBlockedReason } from "./blogPermissions"
import ActionButton from "../ui/ActionButton"
import type { AuthUser } from "../../api/auth"

interface BlogTableProps{
    blogs : Blog[];
    user: AuthUser | null;
    isAdmin : boolean;
    isFetching ? : boolean;
    onView : (blog:Blog) => void;
    onEdit : (blog:Blog) => void;
    onDelete : (blog:Blog) => void;
}

const thClass = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
const tdClass = "px-4 py-3 align-middle"
const actionBaseClass = "rounded-lg px-3 py-1.5 text-sm font-medium transition capitalize"
const actionDisabledClass = "cursor-not-allowed bg-gray-100 text-gray-400"


const BlogTable = ({blogs,isAdmin,isFetching=false,onView,onEdit,onDelete,user}:BlogTableProps) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity ${isFetching ? 'opacity-60':''}`}>
        <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                <th scope="col" className={`${thClass} text-left capitalize`}>blog</th>
                
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

                       

                        {/* category */}

                        <td className={tdClass}>
                            <BlogCategoryBadge category={blog.category_detail} />
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
                            <div className="flex items-center justify-start gap-2">
                                <ActionButton
                                    onClick={()=>onView(blog)}
                                    className={actionBaseClass}
                                    enabledClassName="bg-gray-800 text-white hover:bg-gray-900"
                                    disabledClassName={actionDisabledClass}
                                >
                                    View
                                </ActionButton>

                                <ActionButton
                                 onClick={()=>onEdit(blog)}
                                 disabledReason={getEditBlockedReason(blog,user)}
                                  className={actionBaseClass}
                                    enabledClassName="bg-blue-600 text-white hover:bg-blue-900"
                                    disabledClassName={actionDisabledClass}
                                 >
                                    edit
                                </ActionButton>

                                 <ActionButton
                                    onClick={()=>onDelete(blog)}
                                    disabledReason={getDeleteBlockedReason(blog,user)}
                                    className={actionBaseClass}
                                    enabledClassName="bg-red-600 text-white hover:bg-red-700"
                                    disabledClassName={actionDisabledClass}
                                >
                                    Delete
                                </ActionButton>
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
