import api from "./axios";
import type { Paginated,Video,VideoFilter,VideoPayload,VideoTransition } from "../types/Videos";
import type { BlogBulkAction,BulkResult } from "../types/Blogs";


export async function getVideos(filters:VideoFilter = {}) : Promise<Paginated<Video>> {
    const response = await api.get<Paginated<Video>>('/videos/',{params : filters});
    return response.data;
}

export async function retrieveVideo(id:string) : Promise<Video> {
    const response = await api.get<Video>(`/videos/${id}/`);
    return response.data;
}

export async function createVideo(data:VideoPayload) : Promise<Video> {
    const response = await api.post<Video>('/videos/',data);
    return response.data;
}

export async function updateVideo(id:string,data:Partial<VideoPayload>) : Promise<Video> {
    const response = await api.patch<Video>(`/videos/${id}/`,data);
    return response.data;
}

export async function deleteVideo(id:string) : Promise<void> {
    await api.delete(`/videos/${id}/`);
}

export async function transitionVideo(id:string,transition:VideoTransition,reason?:string) : Promise<Video> {
    const response = await api.post<Video>(`/videos/${id}/${transition}/`,reason ? {reason} : {});
    return response.data;
}