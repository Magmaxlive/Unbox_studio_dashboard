import { FileText } from 'lucide-react'
import Modal from '../ui/Modal'
import RichTextContent from '../ui/RichTextContent'
import type { AuthUser } from '../../api/auth'
import type { Blog } from '../../types/Blogs'
import BlogCategoryBadge from './BlogCategoryBadge'
import ReviewPanel, { type DetailItem } from '../editorial/ReviewPanel'
import { useReviewActions } from '../editorial/useReviewActions'
import formatDate from '../../utlis/formatDate'
import { blogKeys, useBlog, useBlogTransition } from '../../hooks/queries/blogs'
import { getAvailableTransitions, getBlogActionNote, getEditBlockedReason } from './blogPermissions'
import { BLOG_TRANSITION_CONFIG } from './blogTransitions'
import { BLOG_NOUN } from '../bulk/bulkActions'

interface BlogViewModalProps {
    blog : Blog;
    user : AuthUser | null;
    isAdmin : boolean;
    onClose : () => void;
    onEdit : (blog:Blog) => void;
}

const BlogViewModal = ({blog, user, isAdmin, onClose, onEdit}:BlogViewModalProps) => {
    // Live data: refreshed on open, and updated instantly by transitions
    const {data:liveBlog} = useBlog(blog.id);
    const current = liveBlog ?? blog;

    const transitionMutation = useBlogTransition();
    const review = useReviewActions({
        item : current,
        noun : BLOG_NOUN,
        config : BLOG_TRANSITION_CONFIG,
        isPending : transitionMutation.isPending,
        runMutation : (variables, callbacks)=>transitionMutation.mutate(variables, callbacks),
    });

    // Don't close the view while a dialog is on top or a request is running.
    const handleClose = () => {
        if (review.isBusy || review.isDialogOpen) return;
        onClose();
    }

    const isOwnBlog = current.contributor === user?.id;
    const bylineName = isOwnBlog ? 'You' : current.contributor_name;
    const bylineDate = formatDate(current.published_at ?? current.created_at);

    const details : DetailItem[] = [
        {
            label : 'Category',
            value : current.category_detail?.name
                ? <span className="capitalize">{current.category_detail.name}</span>
                : <span className="text-gray-400">Uncategorised</span>,
        },
        ...(isAdmin ? [{ label : 'Contributor', value : <span className="capitalize">{current.contributor_name}</span> }] : []),
        { label : 'Created', value : formatDate(current.created_at) },
        { label : 'Submitted', value : formatDate(current.submitted_at) },
        { label : 'Published', value : formatDate(current.published_at) },
        { label : 'Last updated', value : formatDate(current.updated_at) },
    ];

  return (
    <>
        <Modal isOpen onClose={handleClose} title="Blog preview" maxWidth="max-w-5xl">
            <div className="grid grid-cols-1 gap-8 py-2 tablet:grid-cols-[minmax(0,1fr)_280px]">

                {/* ── article: how readers will see it ── */}
                <article className="min-w-0">
                    {current.cover_image_detail?.url ? (
                        <img
                            src={current.cover_image_detail.url}
                            alt={current.cover_image_detail.alt_text}
                            width={current.cover_image_detail.width ?? undefined}
                            height={current.cover_image_detail.height ?? undefined}
                            className="mb-6 aspect-[16/7] w-full rounded-xl bg-gray-100 object-cover"
                        />
                    ) : (
                        <div className="mb-6 flex aspect-[16/7] items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                            <div className="flex flex-col items-center gap-1.5">
                                <FileText size={28} />
                                <span className="text-xs">No cover image</span>
                            </div>
                        </div>
                    )}

                    <div className="mx-auto max-w-[68ch]">
                        {current.category_detail && (
                            <div className="mb-3">
                                <BlogCategoryBadge category={current.category_detail} />
                            </div>
                        )}

                        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                            {current.title}
                        </h1>

                        <p className="mt-3 text-sm text-gray-500">
                            By <span className="font-medium capitalize text-gray-700">{bylineName}</span>
                            <span className="mx-1.5">·</span>
                            <time dateTime={current.published_at ?? current.created_at}>{bylineDate}</time>
                        </p>

                        {current.excerpt && (
                            <p className="mt-5 text-base leading-7 text-gray-600">{current.excerpt}</p>
                        )}

                        <hr className="my-6 border-gray-100" />

                        <RichTextContent html={current.content} className="text-[15px]" />
                    </div>
                </article>

                <ReviewPanel
                    status={current.status}
                    rejectionReason={current.rejection_reason}
                    actionNote={getBlogActionNote(current, user)}
                    transitions={getAvailableTransitions(current, user)}
                    config={BLOG_TRANSITION_CONFIG}
                    isBusy={review.isBusy}
                    onTransition={review.handleTransitionClick}
                    editBlockedReason={getEditBlockedReason(current, user)}
                    onEdit={()=>onEdit(current)}
                    details={details}
                    activityKey={blogKeys.activity(current.id)}
                    activityPath={`/blogs/${current.id}/activity/`}
                    currentUserId={user?.id}
                />
            </div>
        </Modal>

        {/* dialogs are siblings of the Modal (its panel uses a transform) */}
        {review.dialogs}
    </>
  )
}

export default BlogViewModal