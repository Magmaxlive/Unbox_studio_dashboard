import { useState, useRef } from "react"
import { useBlocker,useNavigate,useLocation, type NavigateOptions } from "react-router-dom"
import { useForm,useSelector } from "@tanstack/react-form"
import { ArrowLeft,Info } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../../contexts/AuthContext"
import { useCreateBlog,useUpdateBlog,useBlogTransition } from "../../hooks/queries/blogs"
import { useCategoryOptions } from "../../hooks/queries/categories"
import useUnSavedChangesWarning from "../../hooks/useUnSavedChangesWarning"
import { blogSchema,type BlogFormValues } from "../../schemas/blog/BlogSchema"
import type { Blog,BlogTransition } from "../../types/Blogs"
import { handleMutationError } from "../../utlis/handleMutationError"
import { getErrorMessage } from "../../utlis/getErrorMessage"
import ConfirmDialog from "../ui/ConfirmDialog"
import { getAvailableTransitions } from "./blogPermissions"
import BlogStatusBadge from "./BlogStatusBadge"
import RichTextEditor from "../ui/RichTextEditor"
import ImageUploader from "../ui/ImageUploader"
import CoverImageField from "./CoverImageField"
import { useUpdateMediaAsset } from "../../hooks/queries/media"
import { BLOG_STATUS_CONFIG } from "./blogStatus"


type SaveIntent = 'save' | 'submit' | 'publish'

interface BlogFormProps {
    //edit mode : the version loaded when the page opened
    initialBlog ? : Blog;
    // edit mode : latest data  (status badge rejection reason)
    liveBlog ? : Blog;
}

const EMPTY_VALUES : BlogFormValues = {
    title : '',
    content : '',
    category : '',
    excerpt : '',
    cover_image : null,
}

const toFormValues = (blog:Blog) : BlogFormValues => ({
    title : blog.title,
    content : blog.content,
    excerpt : blog.excerpt,
    category : blog.category ?? '',
    cover_image : blog.cover_image_detail 
        ?{
           id : blog.cover_image_detail.id,
           url : blog.cover_image_detail.url,
           thumbnail_url : blog.cover_image_detail.thumbnail_url,
           alt_text : blog.cover_image_detail.alt_text 
        }
        : null
})

const EXCERPT_MAX = 300;

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700"
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
const errorClass = "mt-1.5 text-xs text-red-600"

const BlogForm = ({initialBlog,liveBlog}:BlogFormProps) => {
    const isEditing = Boolean(initialBlog);
    const currentBlog = liveBlog ?? initialBlog;

    const navigate = useNavigate();
    const location = useLocation();
    const stateReturnTo = (location.state as { returnTo? : string } | null)?.returnTo;
    const returnTo = stateReturnTo?.startsWith('/blogs') ? stateReturnTo : '/blogs'; 

    const {user} = useAuth();
    const isAdmin = user?.role === 'admin';
    const isEditingOthersContent = Boolean(initialBlog) && initialBlog?.contributor != user?.id;

    const createMutation = useCreateBlog();
    const updateMutation = useUpdateBlog();
    const transitionMutation = useBlogTransition();
    const updateMediaMutation = useUpdateMediaAsset();

    // Categories : active ones , plus the blog's current one even if inactive
    // otherwise saving would silently remove it.
    const { data:categoryOptions=[],isLoading : categoriesLoading } = useCategoryOptions();
    const currentCategoryId = initialBlog?.category ?? '';
    const categories = categoryOptions.filter((cat)=> cat.is_active || cat.id === currentCategoryId);
    const currentCategoryMissing = 
        initialBlog?.category_detail && !categories.some((category)=>category.id === currentCategoryId)
        ? initialBlog.category_detail : null;

    // starting values for form , and the 'saved' baseline for
    // unsaved-changes detection (updated after each save in editmode )
     const [baseline,setBaseline] = useState<BlogFormValues>(()=>
        initialBlog ? toFormValues(initialBlog) : EMPTY_VALUES
    );

    const [apiFieldErrors,setApifieldErrors] = useState<Record<string,string>>({});
    const [categoryError,setCategoryError] = useState('');
    const [coverError,setCoverError] = useState('')

    const storedAltRef = useRef<Record<string,string>>(
        initialBlog?.cover_image_detail
        ? {[initialBlog.cover_image_detail.id] : initialBlog.cover_image_detail.alt_text}
        : {}
    )

    // which button was clicked;
    const intentRef = useRef<SaveIntent>('save');

    // set just before navigating away after a save, so the blocker lets it through
    const allowLeaveRef = useRef(false);
    const leaveTo = (path:string,options?:NavigateOptions) =>{
        allowLeaveRef.current = true;
        navigate(path,options)
    }

    // the author's next step , offered as save and ...
    // admins publish, contibutors submit , in edit mode , only if the rules allow it now.
    const preferredTransition : BlogTransition = isAdmin ? 'publish' : 'submit';
    const nextTransition : BlogTransition | null = currentBlog
    ? (getAvailableTransitions(currentBlog,user).some(({transition})=>transition === preferredTransition)
        ? preferredTransition : null )
        : preferredTransition;
        
    const saveLabel = !isEditing || currentBlog?.status === 'draft' ? 'Save draft' : 'Save changes';
    const nextLabel = !isEditing ? (nextTransition === 'publish' ? 'Publish' : 'Submit for review') 
        : nextTransition === 'publish' ? 'Save and publish' : currentBlog?.status === 'rejected' ? 'Save and resubmit' : 'Save and submit for review';

    const form = useForm({
        defaultValues : baseline,
        validators : {
            onSubmit : blogSchema,
        },
        onSubmit : async ({value}) => {
            const intent = intentRef.current;

            setApifieldErrors({});
            setCategoryError('');
            setCoverError('');

            // submit/publish-only rule (mirrors Blog.get_submission_errors)
            if (intent !== 'save'){
                let blocked = false;
                if(!value.category){
                    setCategoryError('Choose a category before submitting.');
                    blocked = true;
                }

                if (!value.cover_image){
                    setCoverError('Add a cover image before submitting.')
                    blocked = true;
                }

                if (blocked) return;
                
            }

            const status = currentBlog?.status;
            if (status == 'pending' || status == 'published' || status == 'archived'){
                const statusLabel = BLOG_STATUS_CONFIG[status].label.toLowerCase();
                let blocked = false;

                if (baseline.category && !value.category){
                    setCategoryError(`A ${statusLabel} blog's category can be changed but not removed.`);
                    blocked = true;
                }

                if (baseline.cover_image && !value.cover_image){
                    setCoverError(`A ${statusLabel} blog's cover image can be replaced but not removed.`);
                    blocked = true;
                }
                if (blocked) return;
            }

            // 0. alt text lives on the image asset: save it first if it changed
            const cover = value.cover_image;
            if (cover) {
                const altText = cover.alt_text.trim();
                if (altText !== (storedAltRef.current[cover.id] ?? '')) {
                    try {
                        await updateMediaMutation.mutateAsync({ id : cover.id, alt_text : altText });
                        storedAltRef.current[cover.id] = altText;
                    } catch (error) {
                        handleMutationError(error);
                        return;
                    }
                }
            }

            const fields = {
                title : value.title.trim(),
                content : value.content,
                category : value.category || null,
                excerpt : value.excerpt.trim(),
                cover_image : cover?.id ?? null,
            };

            // 1. save (create a draft or update the exisiting blog)
            let saved : Blog;
            try {
                saved = initialBlog
                ? await updateMutation.mutateAsync({id : initialBlog.id , data : fields})
                : await createMutation.mutateAsync({...fields , cover_image : null})
            } catch (error) {
                handleMutationError(error,{setFieldErrors : setApifieldErrors});
                return;
            }

            // Refresh the form with what the server stored 
            const syncWithSaved = () =>{
                const savedValues = toFormValues(saved);
                if (saved.cover_image_detail) {
                    storedAltRef.current[saved.cover_image_detail.id] = saved.cover_image_detail.alt_text;
                }
                setBaseline(savedValues);
                form.reset(savedValues);
            }

            if (intent === 'save'){
                if (!initialBlog){
                    toast.success('Draft Saved');
                    leaveTo(`/blogs/${saved.id}/edit`,{ replace : true, state : location.state });
                    return;
                }
                syncWithSaved();
                toast.success(saved.status === 'draft' ? 'Draft saved' : 'Changes saved');
                return ;
            }

            // submit or publish

            try {
                await transitionMutation.mutateAsync({id:saved.id, transition : intent});
                toast.success(intent === 'publish' ? 'Blog published' : 'Blog submitted for review');
                leaveTo(returnTo)
            } catch (error) {
                handleMutationError(error);
                if (!initialBlog){
                    toast.warning('Your blog was saved as draft . You can submit it from its edit page.')
                    leaveTo(`/blogs/${saved.id}/edit`,{ replace : true, state : location.state })
                }else{
                    toast.warning('Your changes were saved, but the status was not changed.');
                    syncWithSaved();
                }
            }
        }
    });

    const handleSave = (intent : SaveIntent) => {
        intentRef.current = intent;
        form.handleSubmit();
    }

    // unsaved changes
    const currentValues = useSelector(form.store,(state)=>state.values);
    const isSubmitting = useSelector(form.store,(state)=>state.isSubmitting);
    const hasUnSavedChanges = JSON.stringify(currentValues) != JSON.stringify(baseline);

    // browser prompt on refresh/tab close (off while saving)
    useUnSavedChangesWarning(hasUnSavedChanges && !isSubmitting);

    // in-app navigation: links, sidebar, browser back button
    const blocker = useBlocker(({ currentLocation, nextLocation }) =>
        hasUnSavedChanges &&
        !allowLeaveRef.current &&
        currentLocation.pathname !== nextLocation.pathname &&
        nextLocation.pathname !== '/login'
    );

    // cancel / back just navigate;

    const handleLeave = () =>{
        navigate(returnTo)
    }

    const showRejectionReason = currentBlog?.status === 'rejected' && Boolean(currentBlog?.rejection_reason);



  return (
    <div className="flex flex-col gap-6">
      <button type="button" 
        onClick={handleLeave}
        className="flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"> 
        <ArrowLeft size={16} />
            Back to blogs
        </button>

        <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold capitalize sm:text-3xl">
                {isEditing ? 'edit blog' : 'create blog'}
            </h1>
            {currentBlog?.status && <BlogStatusBadge status={currentBlog.status} />}
        </div>

        {/* context while editing */}

        {showRejectionReason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">{currentBlog?.rejection_reason}</p>
            </div>
        )}

        {isEditingOthersContent && (
            <div className="flex items-start gap-2 roundec-xl border border-gray-200 bg-white text-sm p-3 text-gray-600">
                <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <p>
                    You're editing <span className="font-medium capitalize">{initialBlog?.contributor_name}</span>'s blog.
                    Your changes will appear in its activity history.
                </p>
            </div>
        )}

        <form
            onSubmit={(e)=>{ e.preventDefault(); handleSave('save'); }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
            noValidate
        >
            {/* ── main column: writing ── */}
            <div className="flex min-w-0 flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">

                {/* title */}
                <form.Field name="title">
                    {(field)=>(
                        <div>
                            <label htmlFor="title" className={labelClass}>Title</label>
                            <input
                                id="title"
                                type="text"
                                value={field.state.value}
                                onChange={(e)=>field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                placeholder="e.g. Best Walking Tracks Near Auckland"
                                maxLength={300}
                                className={`${inputClass} text-base font-medium`}
                            />
                            {field.state.meta.errors.map((error, index)=>(
                                <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                            ))}
                            {apiFieldErrors.title && <p className={errorClass}>{apiFieldErrors.title}</p>}
                        </div>
                    )}
                </form.Field>

                {/* content (temporary textarea: replaced by the rich-text editor) */}
                <form.Field name="content">
                    {(field)=>(
                        <div>
                            <label htmlFor="content" className={labelClass}>Content</label>
                            <RichTextEditor
                                labelledBy="content-label"
                                value={field.state.value}
                                onChange={field.handleChange}
                                onBlur={field.handleBlur}
                                invalid={field.state.meta.errors.length > 0 || Boolean(apiFieldErrors.content)}
                            />
                            {field.state.meta.errors.map((error, index)=>(
                                <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                            ))}
                            {apiFieldErrors.content && <p className={errorClass}>{apiFieldErrors.content}</p>}
                        </div>
                    )}
                </form.Field>
            </div>

            {/* ── side panel: settings + actions ── */}
            <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6 lg:self-start">
                 {/* cover image */}
                <form.Field name="cover_image">
                    {(field)=>(
                        <div>
                            <CoverImageField
                                value={field.state.value}
                                onChange={(next)=>{
                                    // remember the alt text the asset had when first chosen
                                    if (next && !(next.id in storedAltRef.current)) {
                                        storedAltRef.current[next.id] = next.alt_text;
                                    }
                                    field.handleChange(next);
                                    setCoverError('');
                                }}
                                error={coverError || apiFieldErrors.cover_image}
                                disabled={isSubmitting}
                            />
                            {field.state.meta.errors.map((error, index)=>(
                                <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                            ))}
                        </div>
                    )}
                </form.Field>

                {/* category */}
                <form.Field name="category">
                    {(field)=>(
                        <div>
                            <label htmlFor="category" className={labelClass}>Category</label>
                            <select
                                id="category"
                                value={field.state.value}
                                onChange={(e)=>{
                                    field.handleChange(e.target.value);
                                    setCategoryError('');
                                }}
                                onBlur={field.handleBlur}
                                disabled={categoriesLoading}
                                className={`${inputClass} cursor-pointer capitalize disabled:opacity-50`}
                            >
                                <option value="">{categoriesLoading ? 'Loading...' : 'No category'}</option>
                                {currentCategoryMissing && (
                                    <option value={currentCategoryMissing.id}>{currentCategoryMissing.name} (inactive)</option>
                                )}
                                {categories.map((category)=>(
                                    <option key={category.id} value={category.id}>
                                        {category.name}{category.is_active ? '' : ' (inactive)'}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1.5 text-xs text-gray-500">Required before submitting.</p>
                            {categoryError && <p className={errorClass}>{categoryError}</p>}
                            {apiFieldErrors.category && <p className={errorClass}>{apiFieldErrors.category}</p>}
                        </div>
                    )}
                </form.Field>

                {/* excerpt */}
                <form.Field name="excerpt">
                    {(field)=>(
                        <div>
                            <label htmlFor="excerpt" className={labelClass}>Excerpt</label>
                            <textarea
                                id="excerpt"
                                rows={4}
                                value={field.state.value}
                                onChange={(e)=>field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                placeholder="A short summary shown in listings."
                                maxLength={EXCERPT_MAX}
                                className={inputClass}
                            />
                            <p className="mt-1.5 text-right text-xs text-gray-400">
                                {field.state.value.length}/{EXCERPT_MAX}
                            </p>
                            {field.state.meta.errors.map((error, index)=>(
                                <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                            ))}
                            {apiFieldErrors.excerpt && <p className={errorClass}>{apiFieldErrors.excerpt}</p>}
                        </div>
                    )}
                </form.Field>

                                {/* actions */}
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                    {nextTransition && (
                        <button
                            type="button"
                            onClick={()=>handleSave(nextTransition)}
                            disabled={isSubmitting}
                            className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                nextTransition === 'publish' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-gray-700'
                            }`}
                        >
                            {isSubmitting ? 'Saving...' : nextLabel}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={()=>handleSave('save')}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting && !nextTransition ? 'Saving...' : saveLabel}
                    </button>

                    <button
                        type="button"
                        onClick={handleLeave}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </form>

        <ConfirmDialog
            isOpen={blocker.state === 'blocked'}
            title="discard changes?"
            description="You have unsaved changes. If you leave now, they will be lost."
            confirmText="discard"
            variant="danger"
            onConfirm={()=>blocker.proceed?.()}
            onClose={()=>blocker.reset?.()}
        />
    </div>
  )
}

export default BlogForm
