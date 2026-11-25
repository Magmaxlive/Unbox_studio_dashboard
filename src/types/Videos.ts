import type { Blog,BlogStatus,BlogTransition } from "./Blogs";

// Same shapes as blogs (category summary, image summary): reuse their types.
type CategoryDetail = Blog['category_detail'];
type ImageDetail = Blog['cover_image_detail'];

export type VideoStatus = BlogStatus;
export type VideoTransition = BlogTransition;
export type VideoSourceType = 'upload' | 'embed';
export type VideoProvider = '' | 'youtube' | 'instagram' | 'vimeo' | 'tiktok' ;
export type VideoFileStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'failed' ;

// the uploaded file'sstate and playable URLs (uploads only)
export interface VideoMedia {
    status : VideoFileStatus;
    failure_reason : string;
    duration : string | null;
    width : number | null;
    height : number | null ;
    mp4_url : string | null ;  // CDN when published ,signed link otherwise
    poster_url : string | null ;
}

export interface Video {
    id : string;
    contributor : string;
    contributor_name : string;
    category : string | null;
    category_detail : CategoryDetail;
    title : string;
    slug : string;
    description : string;
    source_type : VideoSourceType;
    source_url : string;
    provider : VideoProvider;
    external_id : string;
    player_url : string;
    media_asset : string | null;
    media : VideoMedia | null;
    thumbnail : string | null;
    thumbnail_detail : ImageDetail;
    duration : string | null;
    status : VideoStatus;
    submitted_at : string | null;
    reviewed_by : string | null;
    reviewed_at : string | null;
    rejection_reason : string;
    published_at : string | null;
    created_at : string;
    updated_at : string;
}

export interface VideoPayload {
    title : string;
    category : string | null ;
    description : string;
    thumbnail : string | null;
    source_type ? : VideoSourceType;  //create only
    source_url ? : string;            // embeds only
}

export interface VideoFilter{
    page? : number;
    page_size? : number;
    status ? : VideoStatus;
    status_in ? : string;
    source_type ? : VideoSourceType;
    category_slug ? : string;
    search ? : string;
    created_after ? : string;
    created_before ? : string;
    ordering ? : string;
}

export interface Paginated<T> {
    count : number;
    next : string | null;
    previous : string | null;
    results : T[];
}

export const PROVIDER_LABELS : Record<Exclude<VideoProvider, ''>,string> = {
    youtube : 'YouTube',
    vimeo : 'Vimeo',
    tiktok : 'TikTok',
    instagram : 'Instagram'
}