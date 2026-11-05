export type BlogStatus = | "draft" | "pending" | "published" | "rejected" | "archived";

export interface Blog{
    id : string;
    contributor : string;
    category : string | null;
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
}

export interface BlogPayload{
    category : string | null;
    title : string;
    content : string;
    excerpt : string;
    cover_image : string | null;
}