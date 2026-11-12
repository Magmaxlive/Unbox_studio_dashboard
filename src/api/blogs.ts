import api from "./axios";
import type { PaginatedResponse } from "../types/PaginatedResponse";
import type { Blog,BlogPayload,BlogFilter,BlogTransition } from "../types/Blogs";
import type { ContentActivity } from "../types/ContentActivity";

// fetch blogs
export async function getBlogs(filters: BlogFilter = {}) : Promise<PaginatedResponse<Blog>> {
    const response = await api.get<PaginatedResponse<Blog>>('/blogs/',{params:filters});
    return response.data;
}

// create blogs
export async function createBlogs(data:BlogPayload) : Promise<Blog> {
    const response = await api.post<Blog>('/blogs/',data);
    return response.data;   
}

// retrieve blog
export async function retrieveBlog(id:string) : Promise<Blog> {
    const response = await api.get<Blog>(`/blogs/${id}/`);
    return response.data;
}

// update blog
export async function updateBlog(id:string,data:Partial<BlogPayload>) : Promise<Blog> {
    const response = await api.patch<Blog>(`/blogs/${id}/`,data);
    return response.data;
}

// delete Blog
export async function deleteBlog(id:string) : Promise<void> {
    await api.delete(`/blogs/${id}/`)
}

// change status : submit | withdraw | publish | reject | archive | restore
export async function transitionBlog(id:string,transition:BlogTransition,reason?:string) : Promise<Blog>{
    const response = await api.post(`/blogs/${id}/${transition}/`,reason ? {reason} : {});
    return response.data
}

// activity history,newest first
export async function getBlogActivity(id:string,page = 1) : Promise<PaginatedResponse<ContentActivity>>{
    const response = await api.get<PaginatedResponse<ContentActivity>>(`/blogs/${id}/activity/`,{params : {page}});
    return response.data;
}