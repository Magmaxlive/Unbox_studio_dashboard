import React, { useEffect, useState } from 'react'
import type { Category } from '../../../types/Category'
import { getCategories } from '../../../api/categories'

const CategoryPage = () => {
    const [categories,setCategories] = useState<Category[]>([]);
    const [loading,setLoading] = useState(true)

    useEffect(()=>{
        async function fetchCategories() {
            try{
                const data = await getCategories();
                return data
            }finally{
                
            }
        }
    },[])
  return (
    <div>
        <h1 className="font-bold text-2xl sm:text-3xl  capitalize">categories</h1>
      
    </div>
  )
}

export default CategoryPage
