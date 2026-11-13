import { useBlocker,useParams,useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useRef,useState } from "react";
import { useForm,useSelector } from "@tanstack/react-form";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { useCreateBlog,useBlogTransition } from "../../../hooks/queries/blogs";
import { useCategoryOptions } from "../../../hooks/queries/categories";
import { blogSchema,type BlogFormValues } from "../../../schemas/blog/BlogSchema";
import type { Blog,BlogPayload } from "../../../types/Blogs";
import { handleMutationError } from "../../../utlis/handleMutationError";
import { getErrorMessage } from "../../../utlis/getErrorMessage";
import ConfirmDialog from "../../ui/ConfirmDialog";
import useUnSavedChangesWarning from "../../../hooks/useUnSavedChangesWarning";


type SaveIntent = 'draft' | 'submit' | 'publish';

const defaultValues : BlogFormValues = {
    title : '',
    category : '',
    excerpt : '',
    content : ''
}

const EXCERPT_MAX = 300;

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700 capitalize"
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
const errorClass = "mt-1.5 text-xs text-red-600"

const BlogFormPage = () => {
    const {id} = useParams<{id:string}>();
    const isEditing = Boolean(id);

    const navigate = useNavigate();
    const {user} = useAuth();
    const isAdmin = user?.role === 'admin';

    const createMutation = useCreateBlog();
    const transitionMutation = useBlogTransition();

    const {data:categoryOptions = [],isLoading : categoriesLoading} = useCategoryOptions();
    // new content shouldn't be filed under an inactive category
    const categories = categoryOptions.filter((category)=>category.is_active);

    const [apiFieldErrors,setApifieldErrors] = useState<Record<string,string>>({});
    const [categoryError,setCategoryError] = useState('')

     // which button was clicked; read inside onSubmit
    const intentRef = useRef<SaveIntent>('draft')
    const allowLeaveRef = useRef(false)

    const leaveAfterSave = ()=>{
        allowLeaveRef.current = true;
        navigate('/blogs')
    }

    const form = useForm({
        defaultValues,
        validators : {
            onSubmit : blogSchema
        },
        onSubmit : async({value}) => {
            const intent = intentRef.current;

            setApifieldErrors({});
            setCategoryError('');

            // submit or publish - only rule
            if (intent !== 'draft' && !value.category){
                setCategoryError('Choose a category before submitting');
                return;
            }

            const payload : BlogPayload = {
                title : value.title.trim(),
                category : value.category || null,
                excerpt : value.excerpt.trim(),
                content : value.content,
                cover_image : null,
            }

            // 1. create (always as draf)
            let created : Blog;
            try {
                created = await createMutation.mutateAsync(payload)
            } catch (error) {
                handleMutationError(error, {setFieldErrors : setApifieldErrors})
                return;
            }

            if (intent === 'draft'){
                toast.success('Draft saved');
                leaveAfterSave();
                return;
            }
            
            // 2.submit or publish after the new draft
            try {
                await transitionMutation.mutateAsync({id:created.id,transition:intent});
                toast.success(intent === 'publish' ? 'Blog published' : 'Blog submitted for review')
            } catch (error) {
                handleMutationError(error);
                toast.warning('Your blog was saved as a draft. You can submit it from the blog list')
            }

            leaveAfterSave();
        }
    });

    const currentValues = useSelector(form.store,(state)=>state.values);
    const isSubmitting = useSelector(form.store,(state)=>state.isSubmitting)
    const hasUnSavedChanges =  JSON.stringify(currentValues) != JSON.stringify(defaultValues)

    useUnSavedChangesWarning(hasUnSavedChanges && !isSubmitting)

    const blocker = useBlocker(({currentLocation,nextLocation})=>
        hasUnSavedChanges && !allowLeaveRef.current && currentLocation.pathname!== nextLocation.pathname && nextLocation.pathname!== '/login'
    )

    const handleLeave = ()=>{
        navigate('/blogs')
    }


    const handleSave = (intent:SaveIntent) => {
        intentRef.current = intent;
        form.handleSubmit();
    }

   if (isEditing) {
        return (
            <div className="flex flex-col gap-6">
                <button type="button" onClick={handleLeave} className="flex cursor-pointer w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
                    <ArrowLeft size={16} /> Back to blogs
                </button>
                <p className="text-sm text-gray-500">Editing blog {id} (edit mode coming in the next step).</p>
            </div>
        )
    }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={handleLeave} className="flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900">
        <ArrowLeft size={16}/> Back to blogs
      </button>

      
        <h1 className="font-bold text-2xl sm:text-3xl capitalize">create blog</h1>

        <form onSubmit={(e)=>{e.preventDefault();handleSave('draft');}} noValidate
            className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >

        {/* main column : writing */}

        <div className="flex min-w-0 flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
            {/* title */}
            <form.Field name="title">
                {(field)=>(
                    <div>
                        <label htmlFor="title" className={labelClass}>title</label>
                        <input 
                        id="title"
                        type="text"
                        value={field.state.value}
                        onChange={(e)=>field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        maxLength={300}
                        placeholder="e.g. Best Walking Tracks Near Auckland"
                        className={`${inputClass} text-base font-medium`} />

                        {field.state.meta.errors.map((error,index)=>(
                            <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                        ))}
                        {apiFieldErrors.title && <p className={errorClass}>{apiFieldErrors.title}</p> } 
                    </div>
                )}
            </form.Field>

                {/* content */}
            <form.Field name="content">
                {(field)=>(
                    <div>
                        <label htmlFor="content" className={labelClass}>content</label>
                        <textarea 
                        id="content"
                        rows={16}
                        value={field.state.value}
                        onChange={(e)=>field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Write your blog..."
                        className={`${inputClass} leading-7`} />

                        {field.state.meta.errors.map((error,index)=>(
                            <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                        ))}
                        {apiFieldErrors.content && <p className={errorClass}>{apiFieldErrors.content}</p> } 
                    </div>
                )}
            </form.Field>
        </div>

        {/* side panel  */}

        <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6 lg:selft-start">
            {/* category */}
            <form.Field name="category">
                {(field)=>(
                    <div>
                        <label htmlFor="category" className={labelClass}>category</label>
                        <select 
                        value={field.state.value}
                         id="category"
                         onChange={(e)=>{field.handleChange(e.target.value); setCategoryError('')}}
                         onBlur={field.handleBlur}
                         disabled={categoriesLoading}
                         className={`${inputClass} cursor-pointer capitalize disabled:opacity-50`}

                         >
                            <option value="">{categoriesLoading ? 'Loading ...' : 'No category'}</option>
                            {categories.map((cat)=>(
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                         </select>
                         <p className="mt-1 text-xs text-gray-500">Required before submitting</p>
                         {categoryError && <p className={errorClass}>{categoryError}</p>}
                            {apiFieldErrors.category && <p className={errorClass}>{apiFieldErrors.category}</p>}
                    </div>
                )}

            </form.Field>

            {/* excerpt */}
            <form.Field name="excerpt">
                {(field)=>(
                    <div>
                        <label htmlFor="excerpt" className={labelClass}>excerpt</label>
                        <textarea
                            id="excerpt"
                            value={field.state.value}
                            onChange={(e)=>field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            rows={4}
                            placeholder="A short summary shown in listings."
                            maxLength={EXCERPT_MAX}
                            className={inputClass}
                        />

                        <p className="mt-1 text-right text-xs text-gray-400">
                            {field.state.value.length}/{EXCERPT_MAX}
                        </p>

                        {field.state.meta.errors.map((error,index)=>(
                            <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                        ))}
                        {apiFieldErrors.excerpt && <p  className={errorClass}>{apiFieldErrors.excerpt}</p>}
                    </div>
                )}

            </form.Field>

            {/* actions */}
            <form.Subscribe selector={(state)=>state.isSubmitting}>
                {(isSubmitting)=>(
                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                        <button 
                        type="button"
                        onClick={()=>handleSave(isAdmin ? 'publish' : 'submit')}
                        disabled={isSubmitting}
                        className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isAdmin ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-700'
                                }`}
                        >
                            {isSubmitting ? 'Saving ...' : isAdmin ? 'Publish' : 'Submit for review'}
                        </button>

                        <button 
                        type="button"
                        onClick={()=>handleSave('draft')}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-white bg-cyan-600 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Save draft
                        </button>
                        <button type="button"
                                onClick={handleLeave}
                                className="px-4 py-2.5 cursor-pointer rounded-lg text-center text-sm font-medium text-white bg-red-500 hover:bg-red-800"
                            >
                                Cancel
                            </button>
                    </div>
                )}
            </form.Subscribe>
        </div>

        </form>

        <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        title="Discard changes ?"
        onClose={()=>blocker.reset?.()}
        variant="danger"
        confirmText="Discard"
        description="You have unsaved changes. If you leave now, they will be lost."
        onConfirm={()=>blocker.proceed?.()}
        />
      
    </div>
  )
}

export default BlogFormPage
