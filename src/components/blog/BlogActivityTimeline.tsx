import { useState } from "react"
import { useBlogActivity } from "../../hooks/queries/blogs"
import type { ContentActivity,ContentActivityAction } from "../../types/ContentActivity"
import { formatDateTime } from "../../utlis/formatDate"


interface BlogActivityTimelineProps{
    blogId:string;
    currentUserId : string | undefined;
}

const ACTION_DOT : Record<ContentActivityAction, string> = {
    created : 'bg-gray-400',
    edited : 'bg-blue-500',
    submitted : 'bg-amber-500',
    withdrawn : 'bg-gray-400',
    published : 'bg-green-500',
    rejected : 'bg-red-500',
    archived : 'bg-slate-500',
    restored : 'bg-green-500',
    deleted : 'bg-red-500',
};

const FIELD_LABELS : Record<string,string> = {
    title : 'title',
    content : 'content',
    excerpt : 'excerpt',
    category : 'category',
    cover_image : 'cover image'
}

const describeActor = (entry:ContentActivity,currentUserId : string | undefined) => {
    if (entry.actor && entry.actor == currentUserId) return 'You';
    return entry.actor_name ?? 'a removed user';
}

const ActivityEntry = ({entry,currentUserId}:{entry:ContentActivity;currentUserId: string | undefined}) => {
    const changed = entry.changed_fields.map((field)=>FIELD_LABELS[field] ?? field).join(',')

    return (
        <li className="relative pl-6">
            {/* dot on the timeline line */}
            <span className={`absolute left-[-5px] top-1.5 size-2.5 rounded-full ring-2 ring-white ${ACTION_DOT[entry.action]}`} />

            <p className="text-sm text-gray-800">
                <span className="font-medium">{entry.action_label}</span>
                <span className="text-gray-500"> by</span>
                <span className="font-medium capitalize"> {describeActor(entry,currentUserId)}</span>
            </p>

            <time dateTime={entry.created_at} className="text-xs text-gray-500">
                {formatDateTime(entry.created_at)}
            </time>

            {changed &&(
                <p className="mt-1 text-xs text-gray-600">
                    Changed : <span className="font-medium">{changed}</span>
                </p>
            )}

            {entry.note && (
                <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                    {entry.note}
                </p>
            )}
        </li>
    )
}


interface ActivityPageProps{
    blogId : string;
    page : number;
    currentUserId : string | undefined;
    isLastShown : boolean;
    onShowMore : ()=>void;
}

// One page of entries. Each page is its own cached query (blogKeys.activityPage).
const ActivityPage = ({blogId,page,currentUserId,isLastShown,onShowMore}:ActivityPageProps) => {
    const {data,isLoading,isError,refetch} = useBlogActivity(blogId,page)

    if (isLoading){
        return <li className="pl-6 text-xs text-gray-500">Loading activity...</li>
    }

    if (isError){
        return(
            <li className="pl-6 text-xs text-red-600">
                Couldn't load activity . {' '}
                <button type="button" onClick={()=>refetch()} className="capitalize cursor-pointer underline">retry</button>
            </li>
        )
    }

    if (page === 1 && !data?.results.length){
        return <li className="pl-6 text-xs text-gray-500">No activity recorded yet.</li>
    }

    return(
        <>
        {data?.results.map((entry)=>(
            <ActivityEntry key={entry.id} entry={entry} currentUserId={currentUserId} />
        ))}

        {isLastShown && data?.next && (
                <li className="pl-6">
                    <button
                        type="button"
                        onClick={onShowMore}
                        className="cursor-pointer text-xs font-medium text-gray-600 underline hover:text-gray-900"
                    >
                        Show older activity
                    </button>
                </li>
            )}
        </>
    )
}

function BlogActivityTimeline({blogId,currentUserId}:BlogActivityTimelineProps) {
    const [pagesShown,setPagesShown] = useState(1);
  return (
    <ol className="ml-1.5 space-y-4 border-1 border-gray-200 py-1">
        {Array.from({length : pagesShown},(_,index)=>{
            const page = index + 1;
            return(
                <ActivityPage
                    key={page}
                    blogId={blogId}
                    currentUserId={currentUserId}
                    isLastShown={page === pagesShown}
                    onShowMore={()=>setPagesShown((c)=>c+1)}
                    page={page}
                />
            )
        })}
    </ol>
  )
}

export default BlogActivityTimeline
