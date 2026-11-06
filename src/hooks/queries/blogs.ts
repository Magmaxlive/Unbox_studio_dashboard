import { useMutation,useQueryClient,useQuery,keepPreviousData } from "@tanstack/react-query";
import { getBlogs,createBlogs,retrieveBlog,updateBlog,deleteBlog } from "../../api/blogs";
import type { BlogPayload,BlogFilter } from "../../types/Blogs";


export const blogKeys = {
    all: ["blogs"] as const,

    lists: () => [...blogKeys.all, "list"] as const,
    list: (filters: BlogFilter) => [...blogKeys.lists(), filters] as const,

    details: () => [...blogKeys.all, "detail"] as const,
    detail: (id: string) => [...blogKeys.details(), id] as const,
}

// fetch all blogs
export function useBlogs(filters:BlogFilter = {}) {
    return useQuery({
        queryKey : blogKeys.list(filters),
        queryFn : () => getBlogs(filters),
        placeholderData : keepPreviousData
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
                queryKey : blogKeys.lists(),
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
                queryKey : blogKeys.lists(),
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
        onSuccess : (_,id) => {
            queryClient.invalidateQueries({
                queryKey : blogKeys.lists()
            });

             queryClient.removeQueries({
                queryKey: blogKeys.detail(id),
            });
        }
    })
}