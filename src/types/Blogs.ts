export type BlogStatus = | "draft" | "pending" | "published" | "rejected" | "archived";

export type BlogTransition = | 'submit' | 'withdraw' | 'publish' | 'reject' | 'archive' | 'restore';

export interface BlogFilter{
    page?:number;
    status?:BlogStatus;
    category?:string;
    search?:string;
    ordering?:string;
    created_after?:string;
    created_before?:string;
}

export interface BlogCategorySummary{
    id:string;
    name:string;
    color_hex:string;
    text_color_hex:string;
}

export interface Blog{
    id : string;
    contributor : string;
    contributor_name : string;
    category : string | null;
    category_detail: BlogCategorySummary | null;
    title : string;
    slug : string;
    content : string;
    excerpt : string;
    cover_image : string | null;
    status : BlogStatus;
    reviewed_by : string | null;
    reviewed_at : string | null;
    rejection_reason : string;
    published_at : string | null;
    created_at : string;
    updated_at : string;
    submitted_at : string | null;
}

export interface BlogPayload{
    category : string | null;
    title : string;
    content : string;
    excerpt : string;
    cover_image : string | null;
}