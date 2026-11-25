import { keepPreviousData,useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import {
    bulkVideoAction,
    bulkVideoCategory,
    createVideo,
    retrieveVideo,
    updateVideo,
    deleteVideo,
    transitionVideo,
    getVideos
} from '../../api/videos'
import type { Video,VideoFilter,VideoPayload,VideoTransition } from "../../types/Videos";
import type { BulkMode } from "../../components/bulk/bulkActions";
import { categoryKeys } from "./categories";

export const videoKeys = {
    all : ['videos'] as const,
    lists : ()=> [...videoKeys.all , 'list'] as const,
    list : (filters:VideoFilter) => [...videoKeys.lists(), filters] as const,
    details : () => [...videoKeys.all, 'detail'] as const,
    detail : (id:string) => [...videoKeys.details(),id] as const,
    activity : (id:string) => [...videoKeys.detail(id), 'activity'] as const,
};

const isProcessing = (video:Video) =>
    video.source_type === 'upload' && video.media?.status === 'processing';

// refresh on its own while something is changing in the background
function pollInterval(videos:Video[] | undefined) : number | false {
    if (!videos?.length) return false;
    if (videos.some(isProcessing)) return 10_000;                       // processing: watch closely
    if (videos.some((video)=>video.status === 'pending')) return 30_000; // pending review
    return false;
}

export function useVideos(filters:VideoFilter){
    return useQuery({
        queryKey : videoKeys.list(filters),
        queryFn : ()=> getVideos(filters),
        placeholderData : keepPreviousData,
        refetchInterval : (query) => pollInterval(query.state.data?.results),
    });
}

export function useVideo(id:string | undefined){
    return useQuery({
        queryKey : videoKeys.detail(id ?? ''),
        queryFn : ()=> retrieveVideo(id ?? ''),
        enabled : Boolean(id),
        refetchInterval : (query) => {
            const video = query.state.data;
            return video && isProcessing(video) ? 10_000 : false;
        },
    });
}


export function useCreateVideo(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : (data:VideoPayload) => createVideo(data),
        onSuccess : (video) => {
            queryClient.setQueryData(videoKeys.detail(video.id), video);
            queryClient.invalidateQueries({ queryKey : videoKeys.lists() });
        },
    });
}

export function useUpdateVideo(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : ({id, data}:{id:string, data:Partial<VideoPayload>}) => updateVideo(id, data),
        onSuccess : (video) => {
            queryClient.setQueryData(videoKeys.detail(video.id), video);
            queryClient.invalidateQueries({ queryKey : videoKeys.lists() });
        },
    });
}

export function useDeleteVideo(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : (id:string) => deleteVideo(id),
        onSuccess : (_data, id) => {
            queryClient.removeQueries({ queryKey : videoKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey : videoKeys.lists() });
            queryClient.invalidateQueries({ queryKey : categoryKeys.lists() });
        },
    });
}

export function useVideoTransition(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : ({id, transition, reason}:{id:string, transition:VideoTransition, reason?:string}) =>
            transitionVideo(id, transition, reason),
        onSuccess : (video) => {
            queryClient.setQueryData(videoKeys.detail(video.id), video);
        },
        onSettled : (_data, _error, {id}) => {
            // refused actions refresh stale screens too
            queryClient.invalidateQueries({ queryKey : videoKeys.lists() });
            queryClient.invalidateQueries({ queryKey : videoKeys.detail(id) });
        },
    });
}

export function useVideoBulkAction(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : ({mode, ids, category}:{mode:BulkMode, ids:string[], category?:string}) =>
            mode === 'category'
                ? bulkVideoCategory(ids, category ?? '')
                : bulkVideoAction(mode, ids),
        onSettled : (result, _error, {mode}) => {
            queryClient.invalidateQueries({ queryKey : videoKeys.lists() });
            queryClient.invalidateQueries({ queryKey : videoKeys.details() });
            if (mode === 'delete') {
                result?.succeeded.forEach((id)=>{
                    queryClient.removeQueries({ queryKey : videoKeys.detail(id) });
                });
            }
            if (mode === 'category' || mode === 'delete') {
                queryClient.invalidateQueries({ queryKey : categoryKeys.lists() });
            }
        },
    });
}