import { useMutation,useQueryClient,useQuery,keepPreviousData } from "@tanstack/react-query";
import { getBlogs,createBlogs,retrieveBlog,updateBlog,deleteBlog,getBlogActivity,transitionBlog } from "../../api/blogs";
import type { BlogPayload,BlogFilter, BlogTransition } from "../../types/Blogs";


export const blogKeys = {
    all: ["blogs"] as const,

    lists: () => [...blogKeys.all, "list"] as const,
    list: (filters: BlogFilter) => [...blogKeys.lists(), filters] as const,

    details: () => [...blogKeys.all, "detail"] as const,
    detail: (id: string) => [...blogKeys.details(), id] as const,

    // nested under detail(id): invalidating or removing a blog's detail
    // also refreshes or removes its activity history
    activity : (id:string) => [...blogKeys.detail(id),'activity'] as const,
    activityPage : (id:string,page:number) => [...blogKeys.activity(id),page] as const,
}

// fetch all blogs
export function useBlogs(filters:BlogFilter = {}) {
    return useQuery({
        queryKey : blogKeys.list(filters),
        queryFn : () => getBlogs(filters),
        placeholderData : keepPreviousData,
        // Poll while any visible blog is awaiting review, so an admin's
        // approve/reject appears without a refresh. Stops when none are pending.
        refetchInterval : (query) =>
            query.state.data?.results.some((blog) => blog.status === 'pending') ? 30_000 : false,
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

// activity history for one blog (newest first)
export function useBlogActivity(id:string,page = 1){
    return useQuery({
        queryKey : blogKeys.activityPage(id,page),
        queryFn:()=> getBlogActivity(id,page),
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


// status change: submit | withdraw | publish | reject | archive | restore
export function useBlogTransition(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : ({id,transition,reason}:{id:string,transition:BlogTransition,reason?:string}) =>
            transitionBlog(id,transition,reason),
        onSuccess : (updatedBlog) => {
            // the response is the updated blog: store it, no refetch needed
            queryClient.setQueryData(blogKeys.detail(updatedBlog.id),updatedBlog);

            // status changed: rows may change status or leave a filtered view
            queryClient.invalidateQueries({
                queryKey : blogKeys.lists()
            });

            // a new activity entry was written
            queryClient.invalidateQueries({
                queryKey : blogKeys.activity(updatedBlog.id)
            })
        },

        onError : (_error,variables) => {
            queryClient.invalidateQueries({
                queryKey : blogKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey : blogKeys.detail(variables.id)
            })
        }
    })
}