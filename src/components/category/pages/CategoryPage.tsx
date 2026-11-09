import { useState } from 'react'
import type { Category, CategoryPayload } from '../../../types/Category'
import { useCategories,useCreateCategory,useUpdateCategory,useDeleteCategory } from '../../../hooks/queries/categories';
import CategoryList from '../CategoryList';
import CategoryForm from '../CategoryForm';
import { useAuth } from '../../../contexts/AuthContext';
import { handleMutationError } from '../../../utlis/handleMutationError';
import { toast } from 'sonner';
import ConfirmDialog from '../../ui/ConfirmDialog';
import Pagination from '../../ui/Pagination';
import CreateButton from '../../ui/CreateButton';
import type { CategoryFilter } from '../../../types/Category';

const STATUS_FILTERS  =[
    {value : 'all',label:'All'},
    {value : 'active',label:'Active'},
    {value : 'inactive',label:'Inactive'},
] as const;

type StatusFilter = typeof STATUS_FILTERS[number]['value']


const CategoryPage = () => {
    const {user} = useAuth();
    const isAdmin = user?.role === 'admin'

    const [currentPage,setCurrentPage] = useState(1);
    const [isFormOpen,setIsFormOpen] = useState(false)
    const [status,setStatus] = useState<StatusFilter>('all')
    const [categoryToDelete,setCategoryToDelete] = useState<string|null>(null)
    const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({});
    const [selectedCategory,setSelectedCategory] = useState<Category|null>(null);

    const filters : CategoryFilter = {page:currentPage}
    if (isAdmin && status !== 'all'){
        filters.is_active = status === 'active'
    }
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching
    } = useCategories(filters);


    const categories = data?.results ?? []
    const totalCount = data?.count ?? 0
    const PAGE_SIZE = 12;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const isSubmitting = createMutation.isPending || updateMutation.isPending

    const handleStatusFilterChange = (value:StatusFilter)=>{
        setStatus(value);
        setCurrentPage(1);
    }

    const handleCreate = ()=>{
        setSelectedCategory(null)
        setIsFormOpen(true)
    }

    const handleEdit = (category:Category) => {
        setSelectedCategory(category)
        setIsFormOpen(true)
    }

    const handleDelete = (id:string) => {
        setCategoryToDelete(id)
    }

    const handleConfirmDelete =()=>{
        if (!categoryToDelete) return ;
        const isLastitemOnPage = categories.length === 1 && currentPage > 1;

        deleteMutation.mutate(categoryToDelete,{
            onSuccess : ()=>{
                toast.success('Categroy Deleted successfully');
                if (isLastitemOnPage){
                    setCurrentPage((page)=>page-1);
                }
                setCategoryToDelete(null)
            },
            onError : (error)=>{
                handleMutationError(error);
                setCategoryToDelete(null)
            }
        })
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
                    setCurrentPage(1);
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
        <div className="flex justify-between items-center gap-4">
            <h1 className="font-bold text-2xl sm:text-3xl capitalize">categories</h1>
            {isAdmin && 
                <CreateButton handleCreate={handleCreate} title='create category' />
            }
        </div>

        {isAdmin && (
            <div role='group' aria-label="Filter categories by status" className="inline-flex w-fit rounded-lg border border-gray-200 bg-white p-1">
                {STATUS_FILTERS.map((option)=>{
                    const isSelected = status === option.value;
                    return(
                        <button key={option.value}
                        type='button'
                        aria-pressed={isSelected}
                        onClick={()=>handleStatusFilterChange(option.value)}
                        className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                isSelected ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {option.label}
                        </button>
                    )
                })}

            </div>
        )}
        <CategoryList categories={categories} handleEdit={handleEdit} onDelete={handleDelete} isFiltered={status !=='all'} />

        <CategoryForm 
            apiFieldErrors={apiFieldErrors} 
            isOpen={isFormOpen} 
            category={selectedCategory} 
            isSubmitting={isSubmitting} 
            onClose={handleCloseForm} 
            onSubmit={handleSubmit}
         />

        <ConfirmDialog 
            isOpen={!!categoryToDelete} 
            description='Are you sure you want to delete this category? This action cannot be undone' 
            title='delete category ?' 
            confirmText='delete category'
            isLoading={deleteMutation.isPending}
            onConfirm={handleConfirmDelete}
            onClose={()=>setCategoryToDelete(null)} 
        />

        <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isLoading={isFetching}
        
        />
    </div>
  )
}

export default CategoryPage
