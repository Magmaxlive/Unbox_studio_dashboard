export type MediaStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'failed';
export type MediaType = 'image' | 'video' | 'document'

export interface MediaAsset {
    id : string;
    media_type : MediaType;
    status : MediaStatus;
    file_name : string;
    file_size : string;
    mime_type : string;
    width : number | null;
    height : number | null;
    alt_text : string;
    failure_reason : string;
    url : string | null;
    thumbnail_url : string | null;
    uploaded_by : string;
    uploaded_by_name : string;
    created_at : string;
}

// presigned s3 form from POST /media/uploads/
export interface PresignedUpload{
    url : string;
    fields : Record<string,string>
}

export interface ImageUploadResponse {
    asset : MediaAsset;
    upload : PresignedUpload
}

export interface MediaFilter{
    page ? : number;
    search ? : string;
    media_type ? : MediaType;
    status ? : MediaStatus;
    oredering ? : string;
}