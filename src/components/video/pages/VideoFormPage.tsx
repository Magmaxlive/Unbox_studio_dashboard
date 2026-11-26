import { useRef, type ReactNode } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { ArrowLeft, Info } from "lucide-react"
import axios from "axios"
import { useAuth } from "../../../contexts/AuthContext"
import { useVideo } from "../../../hooks/queries/videos"
import type { Video } from "../../../types/Videos"
import VideoForm from "../VideoForm"
import { getEditBlockedReason } from "../videoPermissions"

const PageMessage = ({title, children}:{title:string; children?:ReactNode}) => {
    const location = useLocation();
    const stateReturnTo = (location.state as { returnTo? : string } | null)?.returnTo;
    const returnTo = stateReturnTo && (stateReturnTo.startsWith('/videos') || stateReturnTo.startsWith('/admin/review'))
        ? stateReturnTo
        : '/videos';
    const backLabel = returnTo.startsWith('/admin/review') ? 'Back to review' : 'Back to videos';

    return (
        <div className="flex flex-col gap-6">
            <Link
                to={returnTo}
                className="flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
                <ArrowLeft size={16} />
                {backLabel}
            </Link>

            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
                <h1 className="font-semibold text-gray-900">{title}</h1>
                {children}
            </div>
        </div>
    )
}

const VideoEditLoader = ({id}:{id:string}) => {
    const {user} = useAuth();
    const {data, isLoading, isError, error, refetch} = useVideo(id);

    // the form starts from the version loaded first; later updates arrive as liveVideo
    const loadedRef = useRef<Video | null>(null);
    if (data && !loadedRef.current) {
        loadedRef.current = data;
    }
    const loaded = loadedRef.current;

    if (!loaded) {
        if (isLoading) return <PageMessage title="Loading video ..." />

        if (isError) {
            const notFound = axios.isAxiosError(error) && error.response?.status === 404;
            if (notFound) {
                return (
                    <PageMessage title="Video not found">
                        <p className="mt-1 text-sm text-gray-500">
                            It may have been deleted, or you don't have access to it.
                        </p>
                    </PageMessage>
                )
            }
            return (
                <PageMessage title="Couldn't load this video">
                    <button
                        type="button"
                        onClick={()=>refetch()}
                        className="mt-4 cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Retry
                    </button>
                </PageMessage>
            )
        }

        return null;
    }

    const blockedReason = getEditBlockedReason(loaded, user);
    if (blockedReason) {
        return (
            <PageMessage title="This video can't be edited">
                <p className="mx-auto mt-2 flex max-w-md items-start justify-center gap-2 text-sm text-gray-600">
                    <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    {blockedReason}
                </p>
            </PageMessage>
        )
    }

    return <VideoForm initialVideo={loaded} liveVideo={data ?? loaded} />
}

const VideoFormPage = () => {
    const {id} = useParams<{id:string}>();

    if (!id) return <VideoForm key="new" />;
    return <VideoEditLoader key={id} id={id} />
}

export default VideoFormPage