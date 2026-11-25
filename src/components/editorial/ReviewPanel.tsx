import { useState, type ReactNode } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import ActionButton from '../ui/ActionButton'
import BlogStatusBadge from '../blog/BlogStatusBadge'
import ActivityTimeline from './ActivityTimeline'
import type { BlogStatus, BlogTransition } from '../../types/Blogs'
import type { AvailableTransition } from './editorialPermissions'
import type { TransitionConfigMap } from './transitionConfig'

export interface DetailItem {
    label : string;
    value : ReactNode;
}

interface ReviewPanelProps {
    status : BlogStatus;
    rejectionReason : string;
    actionNote : string | null;
    transitions : AvailableTransition[];
    config : TransitionConfigMap;
    isBusy : boolean;
    onTransition : (transition:BlogTransition) => void;
    editBlockedReason : string | null;
    onEdit : () => void;
    details : DetailItem[];
    activityKey : readonly unknown[];
    activityPath : string;
    currentUserId : string | undefined;
}

const panelClass = "rounded-xl border border-gray-200 bg-white p-4"
const panelTitleClass = "text-xs font-semibold uppercase tracking-wide text-gray-500"
const actionButtonClass = "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition"

const DetailRow = ({ label, value }:DetailItem) => (
    <div className="flex items-start justify-between gap-3 py-1.5">
        <dt className="shrink-0 text-xs text-gray-500">{label}</dt>
        <dd className="min-w-0 text-right text-sm font-medium text-gray-800">{value}</dd>
    </div>
)

// The right-hand review column shared by the blog and video previews:
// status + actions, details, and the activity history.
const ReviewPanel = ({
    status, rejectionReason, actionNote, transitions, config, isBusy, onTransition,
    editBlockedReason, onEdit, details, activityKey, activityPath, currentUserId,
}:ReviewPanelProps) => {
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const showRejectionReason = status === 'rejected' && Boolean(rejectionReason);

  return (
    <aside className="order-first flex flex-col gap-4 tablet:order-none tablet:sticky tablet:top-0 tablet:self-start">
        {/* status + actions */}
        <section className={panelClass}>
            <h2 className={panelTitleClass}>Status</h2>
            <div className="mt-2">
                <BlogStatusBadge status={status} />
            </div>

            {showRejectionReason && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <p className="text-xs font-semibold text-red-700">Rejection reason</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">{rejectionReason}</p>
                </div>
            )}

            {actionNote && (
                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-gray-500">
                    <Info size={14} className="mt-0.5 shrink-0 text-gray-400" />
                    {actionNote}
                </p>
            )}

            <div className="mt-4 flex flex-col gap-2">
                {transitions.map(({transition, disabledReason})=>{
                    const item = config[transition];
                    return (
                        <ActionButton
                            key={transition}
                            onClick={()=>onTransition(transition)}
                            disabledReason={isBusy ? 'Please wait...' : disabledReason}
                            className={actionButtonClass}
                            enabledClassName={item.className}
                            disabledClassName="cursor-not-allowed bg-gray-100 text-gray-400"
                        >
                            {item.label}
                        </ActionButton>
                    )
                })}

                <ActionButton
                    onClick={onEdit}
                    disabledReason={editBlockedReason}
                    className={actionButtonClass}
                    enabledClassName="bg-blue-600 text-white hover:bg-blue-700"
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
                {details.map((detail)=>(
                    <DetailRow key={detail.label} {...detail} />
                ))}
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
                <ChevronDown size={16} className={`text-gray-400 transition ${isActivityOpen ? 'rotate-180' : ''}`} />
            </button>

            {isActivityOpen && (
                <div className="mt-3 max-h-80 overflow-y-auto pr-1">
                    <ActivityTimeline activityKey={activityKey} path={activityPath} currentUserId={currentUserId} />
                </div>
            )}
        </section>
    </aside>
  )
}

export default ReviewPanel