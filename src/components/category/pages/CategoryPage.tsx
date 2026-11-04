import React, { useEffect, useState } from 'react'
import type { Category } from '../../../types/Category'
import { useCategories } from '../../../hooks/queries/categories';
import CategoryList from '../CategoryList';

const CategoryPage = () => {
    const {
        data: categories = [],
        isLoading,
        isError,
        error,
        refetch
    } = useCategories();

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
        <h1 className="font-bold text-2xl sm:text-3xl capitalize">categories</h1>
        <CategoryList categories={categories} />
    </div>
  )
}

export default CategoryPage
