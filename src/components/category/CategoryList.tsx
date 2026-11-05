import type { Category } from '../../types/Category'
import { useAuth } from '../../contexts/AuthContext';

interface CategoryListProps{
  categories : Category[];
  handleEdit : (category:Category) => void;
  onDelete : (id:string) => void;
}

const CategoryList = ({categories,handleEdit,onDelete}:CategoryListProps) => {
  const {user} = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!categories.length) return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <h3 className="font-semibold text-gray-900">No categories found</h3>
        <p className="mt-1 text-sm text-gray-500">
        Create your first category to get started.
        </p>
    </div>
  )
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 tablet:grid-cols-3 lg:grid-cols-4 gap-4'>
      {categories.map((category)=>(
        <div key={category.id} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md flex flex-col gap-2">
          {/* category header */}
          <div className="flex justify-between gap-3 items-start">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{backgroundColor:category.color_hex}}>
                  <span className="text-lg font-bold uppercase" style={{color:category.text_color_hex}}>{category.name.charAt(0)}</span>
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold capitalize text-gray-900">
                    {category.name}
                  </h3>
                  <p className="truncate text-xs text-gray-500">/{category.slug}</p>
                </div>

              </div>

              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                category.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>

                {category.is_active ? 'Active' : 'Inactive'}

              </span>

          </div>

          {/* description */}
          <div className="mt-4 min-h-10 flex-1 text-sm leading-5 text-gray-600">
            {category.description || 'Not description provided.'}
          </div>

          {/* created by
          {isAdmin && (
            <p className="py-2 border-t border-gray-100 text-xs flex justify-between text-gray-500 text-right">
              Created by  <span className="font-medium text-gray-600">
                {category.created_by_name}
              </span>
            </p>
          )} */}


          {/* footer */}

            <div className="fixed-bottom flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                 <span
                    className="size-3 rounded-full border border-black/10"
                    style={{ backgroundColor: category.color_hex }}
                  />
                  <span className="text-xs text-gray-500">
                    {category.color_hex}
                  </span>
              </div>

              

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button type='button' onClick={()=> handleEdit(category)} className="rounded-lg border border-gray-200 cursor-pointer px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-700 hover:text-white">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(category.id)}
                    className="rounded-lg border cursor-pointer border-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
                )
              }

              
            </div>
        </div>
      ))}
    </div>
  )
}

export default CategoryList
