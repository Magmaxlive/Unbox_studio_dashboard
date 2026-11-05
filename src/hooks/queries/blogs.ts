import { useMutation,useQueryClient,useQuery } from "@tanstack/react-query";
import { getBlogs,createBlogs,retrieveBlog,updateBlog,deleteBlog } from "../../api/blogs";
import type { BlogPayload } from "../../types/Blogs";
import { string } from "zod";


export const blogKeys = {
    all : ['blogs'] as const,
    detail : (id:string) => ['blogs',id] as const,
}

// fetch all blogs
export function useBlogs(page = 1) {
    return useQuery({
        queryKey : [...blogKeys.all,page],
        queryFn : () => getBlogs(page)
    })
}

// fetch single blog
export function useBlog(id:string){
    return useQuery({
        queryKey : blogKeys.detail(id),
        queryFn : ()=> retrieveBlog(id),
        enabled : !!id,
    })
}

// create blog
export function useCreateBlog(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : (data:BlogPayload) => createBlogs(data),
        onSuccess : () => {
            queryClient.invalidateQueries({
                queryKey : blogKeys.all,
            })
        }
    })

}

// update blog
export function useUpdateBlog(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : ({id,data}:{id:string,data:Partial<BlogPayload>}) => updateBlog(id,data),
        onSuccess : (_,variables) => {
            queryClient.invalidateQueries({
                queryKey : blogKeys.all,
            });

            queryClient.invalidateQueries({
                queryKey:blogKeys.detail(variables.id)
            })

        }
    })
}


// delete blog
export function useDeleteBlog(){
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn : (id:string) => deleteBlog(id),
        onSuccess : () => {
            queryClient.invalidateQueries({
                queryKey : blogKeys.all
            })
        }
    })
}