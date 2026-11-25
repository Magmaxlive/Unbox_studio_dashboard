import axios from "axios";
import api from "./axios";
import type { PaginatedResponse } from "../types/PaginatedResponse";
import type { ImageUploadResponse,MediaAsset,MediaFilter,PresignedUpload } from "../types/Media";

export interface VideoUploadStartPayload {
    video : string;
    file_name : string;
    file_size : number;
    mime_type : string;
}

export interface VideoUploadStartResponse {
    asset : MediaAsset;
    part_size : number;
    part_count : number;
}

export interface UploadedPart {
    part_number : number;
    etag : string;
}

// ask the backend  for an upload
export async function requestImageUpload(file:File) : Promise<ImageUploadResponse> {
    const response = await api.post<ImageUploadResponse>('/media/uploads/',{
        file_name : file.name,
        file_size : file.size,
        mime_type : file.type,
    })
    return response.data;
}

// upload file straight to s3
export async function UploadFileToStorage(
    upload:PresignedUpload,
    file:File,
    options:{ onProgress? : (percent:number) => void; signal? : AbortSignal } = {},
) : Promise <void> {
    const formData = new FormData();
    Object.entries(upload.fields).forEach(([key,value])=> formData.append(key,value));
    formData.append('file',file);

    await axios.post(upload.url,formData, {
        signal : options.signal,
        onUploadProgress : (event) => {
            if (event.total){
                options.onProgress?.(Math.round((event.loaded / event.total) * 100));
            }
        }
    })
}

// tell the backend the upload finished
export async function CompleteImageUpload(id:string) : Promise<MediaAsset> {
    const response = await api.post<MediaAsset>(`/media/${id}/complete/`);
    return response.data;
}

// media library
export async function getMediaAssets(filters:MediaFilter = {}) : Promise<PaginatedResponse<MediaAsset>> {
    const response = await api.get<PaginatedResponse<MediaAsset>>('/media/',{params : filters});
    return response.data;
}

// detail
export async function retriveMediaAsset(id:string) : Promise<MediaAsset> {
    const response = await api.get<MediaAsset>(`/media/${id}/`);
    return response.data;
}

// update
export async function updateMediaAsset(id:string,data:{alt_text:string}) : Promise<MediaAsset> {
    const response = await api.patch<MediaAsset>(`/media/${id}/`,data);
    return response.data;
}

// video
export async function startVideoUpload(data:VideoUploadStartPayload) : Promise<VideoUploadStartResponse> {
    const response = await api.post<VideoUploadStartResponse>('/media/video-uploads/',data);
    return response.data;
}

export async function signVideoParts(assetId:string, partNumbers:number[]) : Promise<{part_number : number; url : string}[]> {
    const response = await api.post<{ urls : { part_number : number; url : string }[] }>(
        `/media/${assetId}/video/parts/`,
        { part_numbers : partNumbers }
    );

    return response.data.urls;
}

export async function completeVideoUpload(assetId:string,parts:UploadedPart[]) : Promise<MediaAsset> {
    const response = await api.post<MediaAsset>(`/media/${assetId}/video/complete/`, {parts});
    return response.data;
}

export async function abortVideoUpload(assetId:string) : Promise<void> {
    await api.post(`/media/${assetId}/video/abort/`);
}