import type { Category,CategoryPayload } from "../types/Category";
import api from "./axios";
import type { PaginatedResponse } from "../types/PaginatedResponse";

// get category
export async function getCategories(page = 1): Promise<PaginatedResponse<Category>> {
    const response = await api.get<PaginatedResponse<Category>>('/category/',{
        params : {page}
    });

    return response.data;
}

// get all categories in one request (used by dropdowns of blog,video)
export async function getCategoryOption():Promise<PaginatedResponse<Category>> {
    const response = await api.get<PaginatedResponse<Category>>('/category/',{
        params : {page_size : 100}
    });
    return response.data
    
}

// create category
export async function createCategory(data : CategoryPayload): Promise<Category>{
    const response = await api.post<Category>('/category/',data);
    return response.data;
}

// retrieve category
export async function retrieveCategory(id:string) : Promise<Category>{
    const response = await api.get<Category>(`/category/${id}/`);
    return response.data;
}

// update category
export async function updateCategory(id : string,data : Partial<CategoryPayload>): Promise<Category>{
    const response = await api.patch<Category>(`/category/${id}/`,data);
    return response.data
}

// delete category
export async function deleteCategory(id:string) : Promise<void>{
    await api.delete(`/category/${id}/`);
}