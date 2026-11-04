import React, { useEffect, useState } from 'react'
import type { Category, CategoryPayload } from '../../../types/Category'
import { useCategories,useCreateCategory,useUpdateCategory,useDeleteCategory } from '../../../hooks/queries/categories';
import CategoryList from '../CategoryList';
import CategoryForm from '../CategoryForm';
import { useAuth } from '../../../contexts/AuthContext';
import { handleMutationError } from '../../../utlis/handleMutationError';
import { toast } from 'sonner';


const CategoryPage = () => {
    const {user} = useAuth();
    const isAdmin = user?.role === 'admin'

    const [isFormOpen,setIsFormOpen] = useState(false)
    const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({});
    const [selectedCategory,setSelectedCategory] = useState<Category|null>(null)
    const {
        data: categories = [],
        isLoading,
        isError,
        error,
        refetch
    } = useCategories();

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    const handleCreate = ()=>{
        setSelectedCategory(null)
        setIsFormOpen(true)
    }

    const handleEdit = (category:Category) => {
        setSelectedCategory(category)
        setIsFormOpen(true)
    }

    const handleCloseForm = ()=>{
        if (isSubmitting) return;
        setIsFormOpen(false)
        setSelectedCategory(null)
        setApiFieldErrors({})
    }

    const handleSubmit = (data:CategoryPayload) => {
        if(selectedCategory){
            updateMutation.mutate({
                id:selectedCategory.id,data,
            },
            {
                onSuccess : ()=>{
                    toast.success('Category Updated successfully')
                   handleCloseForm() 
                } ,
                onError : (error) => {
                    handleMutationError(error, {
                    setFieldErrors: setApiFieldErrors,
                    });
                }
            });
        }else{
            createMutation.mutate(data,{
                onSuccess : ()=>{
                    toast.success('Category Added successfully')
                   handleCloseForm() 
                } ,
                onError: (error) => {
                handleMutationError(error, {
                setFieldErrors: setApiFieldErrors,
                });
            },
            })
        }
    }

    if (isLoading) return <p>Loading categories...</p>

    if (isError){
        return(
            <div>
                <p>{error.message || 'Failed to load categories.'}</p>
                <button onClick={()=>refetch()}>Retry</button>
            </div>
        )
    }
  return (
    <div className='flex flex-col gap-8'>
        <div className="flex justify-between gap-4">
            <h1 className="font-bold text-2xl sm:text-3xl capitalize">categories</h1>
            {isAdmin && 
                <button type='button' onClick={handleCreate} className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 capitalize">+ create category</button>
            }
        </div>
        <CategoryList categories={categories} handleEdit={handleEdit} />
        <CategoryForm apiFieldErrors={apiFieldErrors} isOpen={isFormOpen} category={selectedCategory} isSubmitting={isSubmitting} onClose={handleCloseForm} onSubmit={handleSubmit} />
    </div>
  )
}

export default CategoryPage
