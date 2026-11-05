import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import { getCategories,createCategory,retrieveCategory,updateCategory,deleteCategory } from '../../api/categories'
import type { CategoryPayload } from '../../types/Category'

export const categoryKeys = {
    all: ["categories"] as const,

  lists: () => [...categoryKeys.all, "list"] as const,
  list: (page: number) => [...categoryKeys.lists(), page] as const,

  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

// fetch all categories
export function useCategories(page = 1){
    return useQuery({
        queryKey : categoryKeys.list(page),
        queryFn : ()=> getCategories(page),
    });
}

// fetch single category
export function useCategory(id:string){
    return useQuery({
        queryKey : categoryKeys.detail(id),
        queryFn :() => retrieveCategory(id),
        enabled : !!id,
    })
}

// create category
export function useCreateCategory(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : (data:CategoryPayload) => createCategory(data),
        onSuccess : ()=>{
            queryClient.invalidateQueries({
                queryKey : categoryKeys.lists(),
            });
        }
    })
}

// update category
export function useUpdateCategory(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn : ({id,data}:{id:string,data:Partial<CategoryPayload>}) => updateCategory(id,data),
        onSuccess : (_,variables) => {
            queryClient.invalidateQueries({
                queryKey : categoryKeys.lists()
            });

            queryClient.invalidateQueries({
                queryKey : categoryKeys.detail(variables.id)
            });
        }

    });
}

// delete category
export function useDeleteCategory(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : (id:string) => deleteCategory(id),
        onSuccess : (_,id)=>{
            queryClient.invalidateQueries({
                queryKey : categoryKeys.lists(),
            });

            queryClient.removeQueries({
                queryKey: categoryKeys.detail(id),
            });
        }
    })
}