import axios from "axios";
import api from "./axios";
import type { PaginatedResponse } from "../types/PaginatedResponse";
import type { ImageUploadResponse,MediaAsset,MediaFilter,PresignedUpload } from "../types/Media";

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