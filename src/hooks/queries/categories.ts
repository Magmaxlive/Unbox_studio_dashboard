import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import { getCategories,createCategory,retrieveCategory,updateCategory,deleteCategory } from '../../api/categories'
import type { CategoryPayload } from '../../types/Category'

export const categoryKeys = {
    all : ['categories'] as const,
    detail : (id:string) => ['categories',id] as const,
}

// fetch all categories
export function useCategories(){
    return useQuery({
        queryKey : categoryKeys.all,
        queryFn : getCategories,
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
                queryKey : categoryKeys.all,
            });
        }
    })
}