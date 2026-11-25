import { Film } from "lucide-react"
import type { Video } from "../../types/Videos"
import { PROVIDER_LABELS } from "../../types/Videos"
import type { AuthUser } from "../../api/auth"
import BlogStatusBadge from "../blog/BlogStatusBadge"
import BlogCategoryBadge from "../blog/BlogCategoryBadge"
import formatDate from "../../utlis/formatDate"
import ActionButton from "../ui/ActionButton"
import { getDeleteBlockedReason, getEditBlockedReason } from "./videoPermissions"

interface VideoSelection {
    selectedIds : Set<string>;
    onToggle : (id:string) => void;
    onTogglePage : (ids:string[], checked:boolean) => void;
}

interface VideoTableProps {
    videos : Video[];
    user : AuthUser | null;
    isAdmin : boolean;
    isFetching? : boolean;
    selection? : VideoSelection | null;
    onView : (video:Video) => void;
    onEdit : (video:Video) => void;
    onDelete : (video:Video) => void;
}

const thClass = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
const tdClass = "px-4 py-3 align-middle"
const actionBaseClass = "rounded-lg px-3 py-1.5 text-sm font-medium transition capitalize"
const actionDisabledClass = "cursor-not-allowed bg-gray-100 text-gray-400"

// "20.29" -> "0:20"
export function formatDuration(seconds:string | null) : string {
    if (!seconds) return '';
    const total = Math.round(Number(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const typeLabel = (video:Video) =>
    video.source_type === 'upload'
        ? 'Upload'
        : (video.provider ? PROVIDER_LABELS[video.provider] : 'Embed');

const VideoTable = ({videos, user, isAdmin, isFetching=false, selection=null, onView, onEdit, onDelete}:VideoTableProps) => {
    const pageIds = videos.map((video)=>video.id);
    const selectedOnPage = selection ? pageIds.filter((id)=>selection.selectedIds.has(id)).length : 0;
    const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;

  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                    {selection && (
                        <th scope="col" className={`${thClass} w-10`}>
                            <input
                                type="checkbox"
                                aria-label="Select all videos on this page"
                                checked={allOnPageSelected}
                                ref={(el)=>{ if (el) el.indeterminate = selectedOnPage > 0 && !allOnPageSelected; }}
                                onChange={(e)=>selection.onTogglePage(pageIds, e.target.checked)}
                                className="size-4 cursor-pointer accent-gray-900"
                            />
                        </th>
                    )}
                    <th scope="col" className={`${thClass} text-left`}>video</th>
                    <th scope="col" className={`${thClass} text-left`}>category</th>
                    {isAdmin && <th scope="col" className={`${thClass} text-left`}>contributor</th>}
                    <th scope="col" className={`${thClass} text-left`}>status</th>
                    <th scope="col" className={`${thClass} text-left`}>created</th>
                    {!selection && <th scope="col" className={`${thClass} text-left`}>actions</th>}
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
                {videos.map((video)=>{
                    const image = video.thumbnail_detail?.thumbnail_url ?? video.media?.poster_url ?? null;
                    const duration = formatDuration(video.duration);
                    const fileStatus = video.source_type === 'upload' ? video.media?.status : null;

                    return (
                        <tr key={video.id} className="transition hover:bg-gray-50">
                            {selection && (
                                <td className={`${tdClass} w-10`}>
                                    <input
                                        type="checkbox"
                                        aria-label={`Select ${video.title}`}
                                        checked={selection.selectedIds.has(video.id)}
                                        onChange={()=>selection.onToggle(video.id)}
                                        className="size-4 cursor-pointer accent-gray-900"
                                    />
                                </td>
                            )}

                            {/* video: thumbnail + title + type */}
                            <td className={tdClass}>
                                <div className="flex items-center gap-3">
                                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                        {image ? (
                                            <img src={image} alt="" loading="lazy" className="size-full object-cover" />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-gray-400">
                                                <Film size={20} />
                                            </div>
                                        )}
                                        {duration && (
                                            <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[10px] font-medium text-white">
                                                {duration}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="line-clamp-1 font-medium text-gray-900">{video.title}</p>
                                        <p className="mt-0.5 text-xs text-gray-500">{typeLabel(video)}</p>
                                    </div>
                                </div>
                            </td>

                            <td className={tdClass}>
                                <BlogCategoryBadge category={video.category_detail} />
                            </td>

                            {isAdmin && (
                                <td className={tdClass}>
                                    <span className="whitespace-nowrap capitalize text-gray-700">{video.contributor_name}</span>
                                </td>
                            )}

                            {/* status + upload state */}
                            <td className={tdClass}>
                                <div className="flex flex-col items-start gap-1">
                                    <BlogStatusBadge status={video.status} />
                                    {fileStatus === 'processing' && (
                                        <span className="text-xs font-medium text-amber-600">Processing…</span>
                                    )}
                                    {(fileStatus === 'uploading' || fileStatus === 'pending') && (
                                        <span className="text-xs font-medium text-amber-600">Upload not finished</span>
                                    )}
                                </div>
                            </td>

                            <td className={tdClass}>
                                <time dateTime={video.created_at} className="whitespace-nowrap text-gray-600">
                                    {formatDate(video.created_at)}
                                </time>
                            </td>

                            {!selection && (
                                <td className={tdClass}>
                                    <div className="flex items-center gap-2">
                                        <ActionButton
                                            onClick={()=>onView(video)}
                                            className={actionBaseClass}
                                            enabledClassName="bg-gray-800 text-white hover:bg-gray-900"
                                            disabledClassName={actionDisabledClass}
                                        >
                                            View
                                        </ActionButton>
                                        <ActionButton
                                            onClick={()=>onEdit(video)}
                                            disabledReason={getEditBlockedReason(video, user)}
                                            className={actionBaseClass}
                                            enabledClassName="bg-blue-600 text-white hover:bg-blue-700"
                                            disabledClassName={actionDisabledClass}
                                        >
                                            Edit
                                        </ActionButton>
                                        <ActionButton
                                            onClick={()=>onDelete(video)}
                                            disabledReason={getDeleteBlockedReason(video, user)}
                                            className={actionBaseClass}
                                            enabledClassName="bg-red-600 text-white hover:bg-red-700"
                                            disabledClassName={actionDisabledClass}
                                        >
                                            Delete
                                        </ActionButton>
                                    </div>
                                </td>
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
  )
}

export default VideoTable