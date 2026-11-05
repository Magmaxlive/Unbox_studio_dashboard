import api from "./axios";
import type { PaginatedResponse } from "../types/PaginatedResponse";
import type { Blog,BlogPayload } from "../types/Blogs";

// fetch blogs
export async function getBlogs(page = 1) : Promise<PaginatedResponse<Blog>> {
    const response = await api.get<PaginatedResponse<Blog>>('/blogs/',{params:page});
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