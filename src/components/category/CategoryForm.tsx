import { useEffect } from 'react'
import type { Category,CategoryPayload } from '../../types/Category'
import { categorySchema } from '../../schemas/category/CategorySchema'
import { useForm } from '@tanstack/react-form';
import Modal from '../ui/Modal';
import { getErrorMessage } from '../../utlis/getErrorMessage';


interface CategoryFormProps {
    isOpen : boolean,
    onClose : () => void,
    category? : Category | null;
    onSubmit:(data:CategoryPayload) => void;
    isSubmitting? : boolean;
    apiFieldErrors : Record<string, string>;
   
}

const defaultValues : CategoryPayload = {
    name : "",
    description : "",
    color_name : "",
    color_hex : "",
    text_color_hex : "",
    slug: "",
    is_active : true
}

const CategoryForm = ({apiFieldErrors,isOpen,onClose,category,onSubmit,isSubmitting=false}: CategoryFormProps) => {
    const isEditing = Boolean(category)

    const form = useForm({
        defaultValues : category ? {
            name : category.name,
            description : category.description ?? '',
            color_name : category.color_name ?? '',
            color_hex : category.color_hex,
            text_color_hex : category.text_color_hex,
            is_active : category.is_active,
            slug : category.slug,
        } : defaultValues,
        validators : {
            onSubmit: categorySchema,
        },
        onSubmit : async({value}) => {
            onSubmit(value);
        },
    });

    useEffect(()=>{
        if (isOpen){
            form.reset(
                category ?{
                    name : category.name,
                    description : category.description ?? '',
                    color_name : category.color_name ?? '',
                    color_hex : category.color_hex,
                    text_color_hex : category.text_color_hex,
                    is_active : category.is_active,
                    slug : category.slug,
                } : defaultValues
            );
        }
    },[isOpen,category])
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Category' : 'Create Category'} description={isEditing ? 'Update the category details' : 'Add a new content category'} >
        <form className='space-y-5' onSubmit={(e)=>{e.preventDefault();form.handleSubmit();}}>
            {/* name */}
            <form.Field name='name'>
                {(field)=>(
                    <div>
                        <label htmlFor="name" className="mb-1 5 block text-sm font-medium text-gray-700 capitalize">category name</label>
                        <input type="text" className="w-full rounded-lg border border-gray-200 px-3 py-2 5 text-sm outline-none focus" value={field.state.value} placeholder='eg. Politics' onChange={(e)=>field.handleChange(e.target.value)} onBlur={field.handleBlur} />

                         {field.state.meta.errors.map((error, index) => (
                            <p key={index} className="mt-2 text-xs text-red-500">
                            {getErrorMessage(error)}
                            </p>
                        ))}
                        {apiFieldErrors.name && (
                                <p className="text-xs text-red-600 mt-1">
                                    {apiFieldErrors.name}
                                </p>
                        )}
                    </div>
                )}
            </form.Field>

            {isEditing ? (
                <form.Field name="slug">
                    {(field) => (
                        <div>
                            <label
                                htmlFor="slug"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Category Slug
                            </label>

                            <input
                                id="slug"
                                type="text"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={field.state.value}
                                placeholder="e.g. education"
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                            />

                            {field.state.meta.errors.map((error, index) => (
                                <p key={index} className="mt-2 text-xs text-red-500">
                                    {getErrorMessage(error)}
                                </p>
                            ))}

                             {apiFieldErrors.slug && (
                                <p className="text-xs text-red-600 mt-1">
                                    {apiFieldErrors.slug}
                                </p>
                            )}
                        </div>
                    )}
                </form.Field>
            ) : null}

            {/* description */}

            <form.Field name='description'>
                {(field)=>(
                    <div>
                        <label htmlFor="description" className="mb-1 5 block text-sm font-medium text-gray-700 capitalize">description</label>
                        <textarea rows={3} value={field.state.value} placeholder="Describe this category..." onBlur={field.handleBlur} onChange={(e)=>field.handleChange(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 5 text-sm outline-none focus" />
                            
                         {field.state.meta.errors.map((error, index) => (
                            <p key={index} className="mt-2 text-xs text-red-500">
                            {getErrorMessage(error)}
                            </p>
                        ))}
                    </div>
                )}
            </form.Field>

            {/* color name */}
            <form.Field name='color_name'>
                {(field)=>(
                    <div>
                        <label htmlFor="color_name" className="mb-1 5 block text-sm font-medium text-gray-700 capitalize">color name</label>
                        <input type="text" className="w-full rounded-lg border border-gray-200 px-3 py-2 5 text-sm outline-none focus" value={field.state.value} placeholder='Deep violet' onChange={(e)=>field.handleChange(e.target.value)} onBlur={field.handleBlur} />

                        {field.state.meta.errors.map((error, index) => (
                            <p key={index} className="mt-2 text-xs text-red-500">
                            {getErrorMessage(error)}
                            </p>
                        ))}
                    </div>
                )}
            </form.Field>

            {/* bg color */}
            <form.Field name="color_hex">
            {(field) => (
                <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                   Background Color
                </label>
                    <div className="flex gap-3">
                        <input
                        type="color"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 p-1"
                        />
                        <input
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-gray-900"
                        />
                    </div>

                     {field.state.meta.errors.map((error, index) => (
                            <p key={index} className="mt-2 text-xs text-red-500">
                            {getErrorMessage(error)}
                            </p>
                        ))}
                </div>
            )}
            </form.Field>

            {/* text color */}
           
            <form.Field name="text_color_hex">
            {(field) => (
                <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                   Text Color
                </label>
                    <div className="flex gap-3">
                        <input
                        type="color"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 p-1"
                        />
                        <input
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-gray-900"
                        />
                    </div>

                     {field.state.meta.errors.map((error, index) => (
                            <p key={index} className="mt-1 text-xs text-red-500">
                            {getErrorMessage(error)}
                            </p>
                        ))}

                    {apiFieldErrors.text_color_hex && (
                        <p className="text-xs text-red-600 mt-1">
                            {apiFieldErrors.text_color_hex}
                        </p>
                    )}
                </div>
            )}
            </form.Field>

            {/* preview */}
            <form.Subscribe
                selector={(state)=>({
                    name:state.values.name,
                    color:state.values.color_hex,
                    textColor:state.values.text_color_hex
                })}
            >
                {(values)=>(
                   <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">
                            Preview
                        </p>
                        <div
                            className="rounded-xl p-4 text-center"
                            style={{
                            backgroundColor: values.color,
                            color: values.textColor,
                            }}
                        >
                            <p className="font-semibold">
                            {values.name || "Category name"}
                            </p>
                            <p className="mt-1 text-xs opacity-80">Category preview</p>
                        </div>
                    </div> 
                )}

            </form.Subscribe>

            {/* active status */}

            <form.Field name='is_active'>
                {(field)=>(
                   <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3">
                    <div>
                        <p className="text-sm font-medium text-gray-800">
                        Active category
                        </p>
                        <p className="text-xs text-gray-500">
                        Make this category available for content.
                        </p>
                    </div>
                    <input
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                        className="size-4 accent-gray-900"
                    />
                   </label> 
                )}
            </form.Field>

            {/* actions */}

            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 pt-4 bg-white">
                <button type='button' onClick={onClose} disabled={isSubmitting} className='cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium capitalize text-gray-600 hover:bg-gray-50'>
                    cancel
                </button>

                <form.Subscribe selector={(state)=>state.canSubmit}>
                    {(canSubmit)=> (
                        <button type='submit' disabled={!canSubmit || isSubmitting} className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {isSubmitting ? 'Saving' : isEditing ? 'Save changes':'Create category'}
                        </button>
                    )}
                </form.Subscribe>
            </div>
        </form>
    </Modal>
  )
}

export default CategoryForm
