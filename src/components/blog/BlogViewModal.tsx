import Modal from "../ui/Modal"
import type { Blog } from "../../types/Blogs"
import BlogCategoryBadge from "./BlogCategoryBadge"
import BlogStatusBadge from "./BlogStatusBadge"
import formatDate from "../../utlis/formatDate"

interface BlogViewModalProps{
    blog : Blog;
    isAdmin : boolean;
    onClose : ()=> void;
    onEdit : (blog:Blog) => void
}

interface MetaItemProps{
    label : string;
    value : string | null;
}

const MetaItem = ({label,value}:MetaItemProps) => (
    <div className="min-w-0">
        <dt className="text-xs text-gray-500 capitalize">{label}</dt>
        <dd className="mt-0.5 truncate font-medium text-gray-900">{value}</dd>
    </div>
)

const sectionTitleClass = 'mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'


const BlogViewModal = ({blog,isAdmin,onClose,onEdit}:BlogViewModalProps) => {
    const showRejectionReason = blog.status === 'rejected' && Boolean(blog.rejection_reason)
  return (
    <Modal isOpen onClose={onClose} title={blog.title} maxWidth="max-w-3xl" >
        <div className="flex flex-col gap-6">

            {/* badges */}
            <div className="flex flex-wrap items-center gap-2">
                <BlogCategoryBadge category={blog.category_detail} />
                <BlogStatusBadge status={blog.status}  />
            </div>

            {/* meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
                {isAdmin && (
                    <MetaItem label="contributor" value={blog.contributor_name} />
                )}
                <MetaItem label="created" value={formatDate(blog.created_at)} />
                <MetaItem label="updated" value={formatDate(blog.updated_at)} />
                <MetaItem label="published" value={formatDate(blog.published_at)} />
            </div>

            {/* rejected reason */}
            {showRejectionReason && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-semibold tracking-wide uppercase text-red-700">
                        rejected reason
                    </p>
                    <div className="mt-1 text-red-700 text-sm whitespace-pre-wrap">
                        {blog.rejection_reason}
                    </div>
                </div>
            )}

            {/* excerpt */}
            {blog.excerpt && (
                <section>
                    <h3 className={sectionTitleClass}>excerpt</h3>
                    <p className="text-sm italic leading-6 text-gray-600">{blog.excerpt}</p>
                </section>
            )}

            {/* content: plain text until the rich-text editor + sanitisation are decided */}
            <section>
                <h3 className={sectionTitleClass}>content</h3>
                <div className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
                    {blog.content || 'No content.'}
                </div>

            </section>

            {/* actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                    Close
                </button>
                <button
                    type="button"
                    onClick={()=>onEdit(blog)}
                    className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                    Edit blog
                </button>
            </div>
        </div>
    </Modal>
  )
}

export default BlogViewModal
