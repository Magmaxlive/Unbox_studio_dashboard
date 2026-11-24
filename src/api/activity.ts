import api from "./axios";
import type { ContentActivity } from "../types/ContentActivity";
import type { PaginatedResponse } from "../types/PaginatedResponse";

export async function getContentActivity(path:string,page=1) : Promise<PaginatedResponse<ContentActivity>> {
    const response = await api.get<PaginatedResponse<ContentActivity>>(path,{params : {page}});
    return response.data;
}
