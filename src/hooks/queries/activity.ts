import { useQuery } from "@tanstack/react-query";
import { getContentActivity } from "../../api/activity";

export function useContentActivity(activityKey:readonly unknown[],path:string,page:number){
    return useQuery({
        queryKey : [...activityKey,page],
        queryFn : ()=> getContentActivity(path,page),
        enabled : Boolean(path),
    })
}