import { keepPreviousData,useMutation,useQueryClient,useQuery } from "@tanstack/react-query";
import { getMediaAssets,retriveMediaAsset,CompleteImageUpload,requestImageUpload, updateMediaAsset } from "../../api/media";
import type { MediaFilter } from "../../types/Media";

export const mediaKeys = {
    all : ['media'] as const,

    lists : ()=>[...mediaKeys.all, 'list'] as const,
    list : (filters:MediaFilter) => [...mediaKeys.lists(),filters] as const,

    details : ()=>[...mediaKeys.all ,'detail'] as const,
    detail : (id:string) => [...mediaKeys.details(),id] as const
}

export function useMediaAssets(filters:MediaFilter={},options:{enabled?:boolean}={}){
    return useQuery({
        queryKey : mediaKeys.list(filters),
        queryFn : ()=> getMediaAssets(filters),
        placeholderData : keepPreviousData,
        enabled : options.enabled ?? true,
    })
}

export function useMediaAsset(id:string){
    return useQuery({
        queryKey : mediaKeys.detail(id),
        queryFn : ()=> retriveMediaAsset(id),
        enabled : !!id,
    })
}

export function useUpdateMediaAsset(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : ({id,alt_text}:{id:string,alt_text:string}) => updateMediaAsset(id,{alt_text}),
        onSuccess : (updated) => {
            queryClient.setQueryData(mediaKeys.detail(updated.id),updated);
            queryClient.invalidateQueries({queryKey : mediaKeys.lists()})
            
        }
    })
}