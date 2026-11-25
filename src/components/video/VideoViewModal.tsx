import Modal from '../ui/Modal'
import type { AuthUser } from '../../api/auth'
import type { Video } from '../../types/Videos'
import { PROVIDER_LABELS } from '../../types/Videos'
import BlogCategoryBadge from '../blog/BlogCategoryBadge'
import ReviewPanel, { type DetailItem } from '../editorial/ReviewPanel'
import { useReviewActions } from '../editorial/useReviewActions'
import VideoPlayer from './VideoPlayer'
import { formatDuration } from './VideoTable'
import formatDate from '../../utlis/formatDate'
import { useVideo, useVideoTransition, videoKeys } from '../../hooks/queries/videos'
import { getAvailableTransitions, getEditBlockedReason, getVideoActionNote } from './videoPermissions'
import { VIDEO_NOUN } from '../bulk/bulkActions'
import { VIDEO_TRANSITION_CONFIG } from './videoTransitions'

interface VideoViewModalProps {
    video : Video;
    user : AuthUser | null;
    isAdmin : boolean;
    onClose : () => void;
    onEdit : (video:Video) => void;
}

const VideoViewModal = ({video, user, isAdmin, onClose, onEdit}:VideoViewModalProps) => {
    // Live data: refreshed on open, polled while processing, updated by transitions
    const {data:liveVideo} = useVideo(video.id);
    const current = liveVideo ?? video;

    const transitionMutation = useVideoTransition();
    const review = useReviewActions({
        item : current,
        noun : VIDEO_NOUN,
        config : VIDEO_TRANSITION_CONFIG,
        isPending : transitionMutation.isPending,
        runMutation : (variables, callbacks)=>transitionMutation.mutate(variables, callbacks),
    });

    const handleClose = () => {
        if (review.isBusy || review.isDialogOpen) return;
        onClose();
    }

    const isOwnVideo = current.contributor === user?.id;
    const bylineName = isOwnVideo ? 'You' : current.contributor_name;
    const bylineDate = formatDate(current.published_at ?? current.created_at);
    const duration = formatDuration(current.duration);
    const typeLabel = current.source_type === 'upload'
        ? 'Uploaded video'
        : current.provider ? `${PROVIDER_LABELS[current.provider]} embed` : 'Embedded video';

    const details : DetailItem[] = [
        { label : 'Type', value : typeLabel },
        {
            label : 'Category',
            value : current.category_detail?.name
                ? <span className="capitalize">{current.category_detail.name}</span>
                : <span className="text-gray-400">Uncategorised</span>,
        },
        ...(isAdmin ? [{ label : 'Contributor', value : <span className="capitalize">{current.contributor_name}</span> }] : []),
        ...(duration ? [{ label : 'Length', value : duration }] : []),
        { label : 'Created', value : formatDate(current.created_at) },
        { label : 'Submitted', value : formatDate(current.submitted_at) },
        { label : 'Published', value : formatDate(current.published_at) },
        { label : 'Last updated', value : formatDate(current.updated_at) },
    ];

  return (
    <>
        <Modal isOpen onClose={handleClose} title="Video preview" maxWidth="max-w-5xl">
            <div className="grid grid-cols-1 gap-8 py-2 tablet:grid-cols-[minmax(0,1fr)_280px]">

                {/* ── video: how viewers will see it ── */}
                <article className="min-w-0">
                    <VideoPlayer video={current} />

                    <div className="mx-auto mt-6 max-w-[68ch]">
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
                            {duration && (
                                <>
                                    <span className="mx-1.5">·</span>
                                    {duration}
                                </>
                            )}
                        </p>

                        {current.description ? (
                            <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-gray-700">
                                {current.description}
                            </p>
                        ) : (
                            <p className="mt-5 text-sm italic text-gray-400">No description yet.</p>
                        )}
                    </div>
                </article>

                <ReviewPanel
                    status={current.status}
                    rejectionReason={current.rejection_reason}
                    actionNote={getVideoActionNote(current, user)}
                    transitions={getAvailableTransitions(current, user)}
                    config={VIDEO_TRANSITION_CONFIG}
                    isBusy={review.isBusy}
                    onTransition={review.handleTransitionClick}
                    editBlockedReason={getEditBlockedReason(current, user)}
                    onEdit={()=>onEdit(current)}
                    details={details}
                    activityKey={videoKeys.activity(current.id)}
                    activityPath={`/videos/${current.id}/activity/`}
                    currentUserId={user?.id}
                />
            </div>
        </Modal>

        {review.dialogs}
    </>
  )
}

export default VideoViewModal