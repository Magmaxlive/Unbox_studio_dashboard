import { useState } from 'react'
import { ChevronDown, FileText, Info } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import Modal from '../ui/Modal'
import ActionButton from '../ui/ActionButton'
import ConfirmDialog from '../ui/ConfirmDialog'
import RichTextContent from '../ui/RichTextContent'
import type { AuthUser } from '../../api/auth'
import type { Blog, BlogTransition } from '../../types/Blogs'
import BlogStatusBadge from './BlogStatusBadge'
import BlogCategoryBadge from './BlogCategoryBadge'
import BlogActivityTimeline from './BlogActivityTimeline'
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

const panelClass = "rounded-xl border border-gray-200 bg-white p-4"
const panelTitleClass = "text-xs font-semibold uppercase tracking-wide text-gray-500"
const actionButtonClass = "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition"

const DetailRow = ({ label, value }:{ label:string; value:React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-1.5">
        <dt className="shrink-0 text-xs text-gray-500">{label}</dt>
        <dd className="min-w-0 text-right text-sm font-medium text-gray-800">{value}</dd>
    </div>
)

const BlogViewModal = ({blog,user,isAdmin,onClose,onEdit}:BlogViewModalProps) => {
    // Live data: refreshed on open, and updated instantly by transitions
    const {data:liveBlog} = useBlog(blog.id);
    const current = liveBlog ?? blog;

    const transitionMutation = useBlogTransition();
    const isBusy = transitionMutation.isPending;

    const [pendingConfirm,setPendingConfirm] = useState<BlogTransition | null>(null);
    const [isRejectOpen,setIsRejectOpen] = useState(false);
    const [rejectErrors,setRejectErrors] = useState<Record<string, string>>({});
    const [isActivityOpen,setIsActivityOpen] = useState(false);

    const isOwnBlog = current.contributor === user?.id;
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
                const isFixable = axios.isAxiosError(error) && error.response?.status === 400;

                if (transition === 'reject' && isFixable) {
                    // e.g. {"reason": ...}: keep the dialog open so it can be corrected
                    handleMutationError(error, { setFieldErrors : setRejectErrors });
                    return;
                }

                // not fixable here (e.g. 403: status already changed elsewhere)
                handleMutationError(error);
                setPendingConfirm(null);
                setIsRejectOpen(false);
                setRejectErrors({});
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

    const bylineName = isOwnBlog ? 'You' : current.contributor_name;
    const bylineDate = formatDate(current.published_at ?? current.created_at);

  return (
    <>
        <Modal isOpen onClose={handleClose} title="Blog preview" maxWidth="max-w-5xl">
            <div className="grid grid-cols-1 gap-8 py-2 tablet:grid-cols-[minmax(0,1fr)_280px]">

                {/* ── article: how readers will see it ── */}
                <article className="min-w-0">
                    {/* cover image area (placeholder until media uploads, Phase 4) */}
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
                            <p className="mt-5 text-base leading-7 text-gray-600">
                                {current.excerpt}
                            </p>
                        )}

                        <hr className="my-6 border-gray-100" />

                        {/* cleaned HTML, styled the same as the editor */}
                        <RichTextContent html={current.content} className="text-[15px]" />
                    </div>
                </article>

                {/* ── review panel (first on mobile, sticky on desktop) ── */}
                <aside className="order-first flex flex-col gap-4 tablet:order-none tablet:sticky tablet:top-0 tablet:self-start">

                    {/* status + actions */}
                    <section className={panelClass}>
                        <h2 className={panelTitleClass}>Status</h2>
                        <div className="mt-2">
                            <BlogStatusBadge status={current.status} />
                        </div>

                        {showRejectionReason && (
                            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                                <p className="text-xs font-semibold text-red-700">Rejection reason</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">{current.rejection_reason}</p>
                            </div>
                        )}

                        {actionNote && (
                            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-gray-500">
                                <Info size={14} className="mt-0.5 shrink-0 text-gray-400" />
                                {actionNote}
                            </p>
                        )}

                        <div className="mt-4 flex flex-col gap-2">
                            {availableTransitions.map(({transition, disabledReason})=>{
                                const config = BLOG_TRANSITION_CONFIG[transition];
                                return (
                                    <ActionButton
                                        key={transition}
                                        onClick={()=>handleTransitionClick(transition)}
                                        disabledReason={isBusy ? 'Please wait...' : disabledReason}
                                        className={actionButtonClass}
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
                                className={actionButtonClass}
                                enabledClassName="bg-blue-600 text-white hover:bg-blue-900"
                                disabledClassName="cursor-not-allowed border border-gray-100 text-gray-300"
                            >
                                Edit
                            </ActionButton>
                        </div>
                    </section>

                    {/* details */}
                    <section className={panelClass}>
                        <h2 className={panelTitleClass}>Details</h2>
                        <dl className="mt-2 divide-y divide-gray-50">
                            <DetailRow
                                label="Category"
                                value={current.category_detail?.name
                                    ? <span className="capitalize">{current.category_detail.name}</span>
                                    : <span className="text-gray-400">Uncategorised</span>}
                            />
                            {isAdmin && (
                                <DetailRow
                                    label="Contributor"
                                    value={<span className="capitalize">{current.contributor_name}</span>}
                                />
                            )}
                            <DetailRow label="Created" value={formatDate(current.created_at)} />
                            <DetailRow label="Submitted" value={formatDate(current.submitted_at)} />
                            <DetailRow label="Published" value={formatDate(current.published_at)} />
                            <DetailRow label="Last updated" value={formatDate(current.updated_at)} />
                        </dl>
                    </section>

                    {/* activity (fetched only when opened) */}
                    <section className={panelClass}>
                        <button
                            type="button"
                            onClick={()=>setIsActivityOpen((open)=>!open)}
                            aria-expanded={isActivityOpen}
                            className="flex w-full cursor-pointer items-center justify-between text-left"
                        >
                            <h2 className={panelTitleClass}>Activity</h2>
                            <ChevronDown
                                size={16}
                                className={`text-gray-400 transition ${isActivityOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {isActivityOpen && (
                            <div className="mt-3 max-h-80 overflow-y-auto pr-1">
                                <BlogActivityTimeline blogId={current.id} currentUserId={user?.id} />
                            </div>
                        )}
                    </section>
                </aside>
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