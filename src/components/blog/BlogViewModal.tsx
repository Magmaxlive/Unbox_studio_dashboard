import { useState } from 'react'
import { Info } from 'lucide-react'
import { toast } from 'sonner'
import Modal from '../ui/Modal'
import ActionButton from '../ui/ActionButton'
import ConfirmDialog from '../ui/ConfirmDialog'
import type { AuthUser } from '../../api/auth'
import type { Blog, BlogTransition } from '../../types/Blogs'
import BlogStatusBadge from './BlogStatusBadge'
import BlogCategoryBadge from './BlogCategoryBadge'
import RejectDialog from './RejectDialog'
import formatDate from '../../utlis/formatDate'
import { handleMutationError } from '../../utlis/handleMutationError'
import { useBlog, useBlogTransition } from '../../hooks/queries/blogs'
import { getAvailableTransitions, getBlogActionNote, getEditBlockedReason } from './blogPermissions'
import { BLOG_TRANSITION_CONFIG } from './blogTransitions'

interface BlogViewModalProps {
    blog : Blog;
    user : AuthUser | null;
    isAdmin : boolean;
    onClose : () => void;
    onEdit : (blog:Blog) => void;
}

interface MetaItemProps {
    label : string;
    value : string;
}

const MetaItem = ({label,value}:MetaItemProps) => (
    <div className="min-w-0">
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="mt-0.5 truncate font-medium text-gray-900">{value}</dd>
    </div>
)

const sectionTitleClass = "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
const footerButtonClass = "rounded-lg px-4 py-2.5 text-sm font-medium transition"

const BlogViewModal = ({blog,user,isAdmin,onClose,onEdit}:BlogViewModalProps) => {
    // Live data: refreshed on open, and updated instantly by transitions
    // (useBlogTransition writes the new blog into this cache entry).
    const {data:liveBlog} = useBlog(blog.id);
    const current = liveBlog ?? blog;

    const transitionMutation = useBlogTransition();
    const isBusy = transitionMutation.isPending;

    const [pendingConfirm,setPendingConfirm] = useState<BlogTransition | null>(null);
    const [isRejectOpen,setIsRejectOpen] = useState(false);
    const [rejectErrors,setRejectErrors] = useState<Record<string, string>>({});

    const showRejectionReason = current.status === 'rejected' && Boolean(current.rejection_reason);
    const actionNote = getBlogActionNote(current, user);
    const availableTransitions = getAvailableTransitions(current, user);
    const confirmConfig = pendingConfirm ? BLOG_TRANSITION_CONFIG[pendingConfirm].confirm : undefined;

    const runTransition = (transition:BlogTransition, reason?:string) => {
        transitionMutation.mutate({id:current.id, transition, reason},{
            onSuccess : ()=>{
                toast.success(BLOG_TRANSITION_CONFIG[transition].successMessage);
                setPendingConfirm(null);
                setIsRejectOpen(false);
                setRejectErrors({});
            },
            onError : (error)=>{
                if (transition === 'reject') {
                    // keep the dialog open; a {"reason": ...} error shows under the textarea
                    handleMutationError(error, { setFieldErrors : setRejectErrors });
                    return;
                }
                handleMutationError(error);
                setPendingConfirm(null);
            },
        });
    }

    const handleTransitionClick = (transition:BlogTransition) => {
        if (transition === 'reject') {
            setRejectErrors({});
            setIsRejectOpen(true);
            return;
        }

        if (BLOG_TRANSITION_CONFIG[transition].confirm) {
            setPendingConfirm(transition);
            return;
        }

        runTransition(transition);
    }

    // Don't close the view while a dialog is on top or a request is running.
    const handleClose = () => {
        if (isBusy || pendingConfirm || isRejectOpen) return;
        onClose();
    }

  return (
    <>
        <Modal isOpen onClose={handleClose} title={current.title} maxWidth="max-w-3xl">
            <div className="flex flex-col gap-6">

                {/* badges */}
                <div className="flex flex-wrap items-center gap-2">
                    <BlogStatusBadge status={current.status} />
                    <BlogCategoryBadge category={current.category_detail} />
                </div>

                {/* why edit/delete are limited (works on touch devices, unlike tooltips) */}
                {actionNote && (
                    <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                        <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
                        <p>{actionNote}</p>
                    </div>
                )}

                {/* meta */}
                <dl className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-4">
                    {isAdmin && <MetaItem label="Contributor" value={current.contributor_name} />}
                    <MetaItem label="Created" value={formatDate(current.created_at)} />
                    <MetaItem label="Submitted" value={formatDate(current.submitted_at)} />
                    <MetaItem label="Published" value={formatDate(current.published_at)} />
                </dl>

                {/* rejection reason */}
                {showRejectionReason && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                            Rejection reason
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                            {current.rejection_reason}
                        </p>
                    </div>
                )}

                {/* excerpt */}
                {current.excerpt && (
                    <section>
                        <h3 className={sectionTitleClass}>Excerpt</h3>
                        <p className="text-sm italic leading-6 text-gray-600">{current.excerpt}</p>
                    </section>
                )}

                {/* content: plain text until the editor step switches this to rendered HTML */}
                <section>
                    <h3 className={sectionTitleClass}>Content</h3>
                    <div className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">
                        {current.content || 'No content.'}
                    </div>
                </section>

                {/* actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className={`cursor-pointer border border-gray-200 text-gray-600 hover:bg-gray-50 ${footerButtonClass}`}
                    >
                        Close
                    </button>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {availableTransitions.map(({transition, disabledReason})=>{
                            const config = BLOG_TRANSITION_CONFIG[transition];
                            return (
                                <ActionButton
                                    key={transition}
                                    onClick={()=>handleTransitionClick(transition)}
                                    disabledReason={isBusy ? 'Please wait...' : disabledReason}
                                    className={footerButtonClass}
                                    enabledClassName={config.className}
                                    disabledClassName="cursor-not-allowed bg-gray-100 text-gray-400"
                                >
                                    {config.label}
                                </ActionButton>
                            )
                        })}

                        <ActionButton
                            onClick={()=>onEdit(current)}
                            disabledReason={getEditBlockedReason(current, user)}
                            className={footerButtonClass}
                            enabledClassName="border border-gray-200 text-blue-700 hover:bg-blue-700 hover:text-white"
                            disabledClassName="cursor-not-allowed border border-gray-100 text-gray-300"
                        >
                            Edit
                        </ActionButton>
                    </div>
                </div>
            </div>
        </Modal>

        {/* dialogs are siblings of the Modal (its panel uses a transform,
            which would trap position:fixed children inside it) */}
        {confirmConfig && pendingConfirm && (
            <ConfirmDialog
                isOpen
                title={confirmConfig.title}
                description={`"${current.title}". ${confirmConfig.description}`}
                confirmText={confirmConfig.confirmText}
                variant={confirmConfig.variant}
                loadingText="Working..."
                isLoading={isBusy}
                onConfirm={()=>runTransition(pendingConfirm)}
                onClose={()=>{ if (!isBusy) setPendingConfirm(null); }}
            />
        )}

        <RejectDialog
            isOpen={isRejectOpen}
            blogTitle={current.title}
            isSubmitting={isBusy}
            apiFieldErrors={rejectErrors}
            onConfirm={(reason)=>runTransition('reject', reason)}
            onClose={()=>setIsRejectOpen(false)}
        />
    </>
  )
}

export default BlogViewModal