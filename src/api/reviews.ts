import api from "./axios";
import type { PaginatedResponse } from "../types/PaginatedResponse";
import type { Blog } from "../types/Blogs";
import type { Video } from "../types/Videos";

export type ReviewApiItem =
    | { kind : 'blog'; item : Blog }
    | { kind : 'video'; item : Video };

export interface ReviewQueueParams {
    page? : number;
    page_size ? : number;
    search ? : string;
    category_slug ? : string;
}

export async function getReviewQueue(params:ReviewQueueParams) : Promise<PaginatedResponse<ReviewApiItem>> {
    const response = await api.get<PaginatedResponse<ReviewApiItem>>('/reviews/',{params})
    return response.data;
}