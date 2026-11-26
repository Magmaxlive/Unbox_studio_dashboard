import { useRef, useState,useCallback,useEffect } from "react"
import { useBlocker, useLocation, useNavigate, type NavigateOptions } from "react-router-dom"
import { useForm, useSelector } from "@tanstack/react-form"
import { ArrowLeft, Info, Link2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../../contexts/AuthContext"
import { useCreateVideo, useUpdateVideo, useVideoTransition } from "../../hooks/queries/videos"
import { useCategoryOptions } from "../../hooks/queries/categories"
import { useUpdateMediaAsset } from "../../hooks/queries/media"
import useUnSavedChangesWarning from "../../hooks/useUnSavedChangesWarning"
import { videoSchema, DESCRIPTION_MAX, TITLE_MAX, type VideoFormValues } from "../../schemas/video/VideoSchema"
import type { Video, VideoPayload, VideoSourceType, VideoTransition } from "../../types/Videos"
import { handleMutationError } from "../../utlis/handleMutationError"
import { getErrorMessage } from "../../utlis/getErrorMessage"
import ConfirmDialog from "../ui/ConfirmDialog"
import BlogStatusBadge from "../blog/BlogStatusBadge"
import CoverImageField from "../blog/CoverImageField"
import { BLOG_STATUS_CONFIG } from "../blog/blogStatus"
import VideoPlayer from "./VideoPlayer"
import { getAvailableTransitions } from "./videoPermissions"
import VideoUploader from "./videoUploader"
import { checkVideoFile } from "../../utlis/videoFile"

type SaveIntent = 'save' | 'submit' | 'publish'

interface VideoFormProps {
    // edit mode: the version loaded when the page opened
    initialVideo? : Video;
    // edit mode: latest data (status, file processing, rejection reason)
    liveVideo? : Video;
}

const EMPTY_VALUES : VideoFormValues = {
    title : '',
    description : '',
    category : '',
    thumbnail : null,
    source_type : 'upload',     // Unbox is video-first
    source_url : '',
}

const toFormValues = (video:Video) : VideoFormValues => ({
    title : video.title,
    description : video.description,
    category : video.category ?? '',
    thumbnail : video.thumbnail_detail
        ? {
            id : video.thumbnail_detail.id,
            url : video.thumbnail_detail.url,
            thumbnail_url : video.thumbnail_detail.thumbnail_url,
            alt_text : video.thumbnail_detail.alt_text,
        }
        : null,
    source_type : video.source_type,
    source_url : video.source_url,
})

const SOURCE_TYPE_OPTIONS : { value:VideoSourceType; label:string; description:string; icon:React.ReactNode }[] = [
    { value : 'upload', label : 'Upload a video', description : 'MP4 or MOV, up to 60 seconds.', icon : <Upload size={18} /> },
    { value : 'embed', label : 'Embed a link', description : 'YouTube, Vimeo, TikTok or Instagram.', icon : <Link2 size={18} /> },
];

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700"
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
const errorClass = "mt-1.5 text-xs text-red-600"

const VideoForm = ({initialVideo, liveVideo}:VideoFormProps) => {
    const isEditing = Boolean(initialVideo);
    const currentVideo = liveVideo ?? initialVideo;

    const navigate = useNavigate();
    const location = useLocation();
    const stateReturnTo = (location.state as { returnTo? : string } | null)?.returnTo;
    // only known pages: navigation state is easy to tamper with
    const returnTo = stateReturnTo && (stateReturnTo.startsWith('/videos') || stateReturnTo.startsWith('/admin/review'))
        ? stateReturnTo
        : '/videos';
    const backLabel = returnTo.startsWith('/admin/review') ? 'Back to review' : 'Back to videos';

    const {user} = useAuth();
    const isAdmin = user?.role === 'admin';
    const isEditingOthersContent = Boolean(initialVideo) && initialVideo?.contributor !== user?.id;

    const createMutation = useCreateVideo();
    const updateMutation = useUpdateVideo();
    const transitionMutation = useVideoTransition();
    const updateMediaMutation = useUpdateMediaAsset();

    // Categories: active ones, plus the video's current one even if inactive
    const { data:categoryOptions = [], isLoading:categoriesLoading } = useCategoryOptions();
    const currentCategoryId = initialVideo?.category ?? '';
    const categories = categoryOptions.filter((cat)=>cat.is_active || cat.id === currentCategoryId);
    const currentCategoryMissing =
        initialVideo?.category_detail && !categories.some((category)=>category.id === currentCategoryId)
        ? initialVideo.category_detail : null;

    const [baseline, setBaseline] = useState<VideoFormValues>(()=>
        initialVideo ? toFormValues(initialVideo) : EMPTY_VALUES
    );

    const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const storedAltRef = useRef<Record<string, string>>(
        initialVideo?.thumbnail_detail
            ? { [initialVideo.thumbnail_detail.id] : initialVideo.thumbnail_detail.alt_text }
            : {}
    );

    const intentRef = useRef<SaveIntent>('save');

    const allowLeaveRef = useRef(false);
    const leaveTo = (path:string, options?:NavigateOptions) => {
        allowLeaveRef.current = true;
        navigate(path, options);
    }

     // a file picked on /videos/new, uploaded once the draft exists
     const pendingFileRef = useRef<File | null>(null);
     const [pendingFileName,setPendingFileName] = useState('');

    // a file handed over from /videos/new: read once, then cleared from history
    const handedOverFile = useRef<File | null>(
        (location.state as {pendingUpload? : File} | null)?.pendingUpload ?? null
    ).current;

    const [isUploading,setIsUploading] = useState(false);
    const handleUploadBusyChange = useCallback((busy:boolean)=>setIsUploading(busy),[])

    // the author's next step: admins publish, contributors submit
    const preferredTransition : VideoTransition = isAdmin ? 'publish' : 'submit';
    const nextTransition : VideoTransition | null = currentVideo
        ? (getAvailableTransitions(currentVideo, user).some(({transition})=>transition === preferredTransition)
            ? preferredTransition : null)
        : preferredTransition;

    const saveLabel = !isEditing || currentVideo?.status === 'draft' ? 'Save draft' : 'Save changes';
    const nextLabel = !isEditing
        ? (nextTransition === 'publish' ? 'Publish' : 'Submit for review')
        : nextTransition === 'publish' ? 'Save and publish'
        : currentVideo?.status === 'rejected' ? 'Save and resubmit' : 'Save and submit for review';

    const form = useForm({
        defaultValues : baseline,
        validators : {
            onSubmit : videoSchema,
        },
        onSubmit : async ({value}) => {
            const intent = intentRef.current;

            setApiFieldErrors({});
            setFieldErrors({});

            const errors : Record<string, string> = {};
            const linkChanged = value.source_url.trim() !== (currentVideo?.source_url ?? '');

            // submit/publish-only rules (mirror Video.get_submission_errors)
            if (intent !== 'save') {
                if (!value.category) errors.category = 'Choose a category before submitting.';
                if (!value.thumbnail) errors.thumbnail = 'Add a thumbnail before submitting.';
                if (!value.description.trim()) errors.description = 'Add a description before submitting.';

                if (value.source_type === 'embed') {
                    // a changed link is checked by the server on save, just below
                    if (!value.source_url.trim()) errors.source_url = 'Add a valid video link before submitting.';
                } else {
                    const media = currentVideo?.media;
                    if (!media) errors.media = 'Upload a video before submitting.';
                    else if (media.status === 'failed') errors.media = 'The video upload failed. Please upload it again.';
                    else if (media.status !== 'ready') errors.media = 'The video is still processing. Please try again in a moment.';
                }
            }

            // once submitted: replace but not remove (mirrors the serializer)
            const status = currentVideo?.status;
            if (status === 'pending' || status === 'published' || status === 'archived') {
                const statusLabel = BLOG_STATUS_CONFIG[status].label.toLowerCase();
                if (baseline.category && !value.category) {
                    errors.category = `A ${statusLabel} video's category can be changed but not removed.`;
                }
                if (baseline.thumbnail && !value.thumbnail) {
                    errors.thumbnail = `A ${statusLabel} video's thumbnail can be replaced but not removed.`;
                }
                if (baseline.source_url && !value.source_url.trim()) {
                    errors.source_url = `A ${statusLabel} video's link can be replaced but not removed.`;
                }
            }

            if (Object.keys(errors).length) {
                setFieldErrors(errors);
                return;
            }

            // 0. alt text lives on the image asset: save it first if it changed
            const thumbnail = value.thumbnail;
            if (thumbnail) {
                const altText = thumbnail.alt_text.trim();
                if (altText !== (storedAltRef.current[thumbnail.id] ?? '')) {
                    try {
                        await updateMediaMutation.mutateAsync({ id : thumbnail.id, alt_text : altText });
                        storedAltRef.current[thumbnail.id] = altText;
                    } catch (error) {
                        handleMutationError(error);
                        return;
                    }
                }
            }

            const fields : VideoPayload = {
                title : value.title.trim(),
                description : value.description.trim(),
                category : value.category || null,
                thumbnail : thumbnail?.id ?? null,
            };
            if (!initialVideo) fields.source_type = value.source_type;   // create only
            if (value.source_type === 'embed' && (!initialVideo || linkChanged)) {
                fields.source_url = value.source_url.trim();              // only when new or changed
            }

            // 1. save (create a draft, or update the existing video)
            let saved : Video;
            try {
                saved = initialVideo
                    ? await updateMutation.mutateAsync({ id : initialVideo.id, data : fields })
                    : await createMutation.mutateAsync(fields);
            } catch (error) {
                handleMutationError(error, { setFieldErrors : setApiFieldErrors });
                return;
            }

            const syncWithSaved = () => {
                const savedValues = toFormValues(saved);
                if (saved.thumbnail_detail) {
                    storedAltRef.current[saved.thumbnail_detail.id] = saved.thumbnail_detail.alt_text;
                }
                setBaseline(savedValues);
                form.reset(savedValues);
            }

            if (intent === 'save') {
                if (!initialVideo) {
                    const file = pendingFileRef.current;
                    pendingFileRef.current = null;
                    toast.success(file ? 'Draft saved. Uploading the video…' : 'Draft saved');
                    leaveTo(`/videos/${saved.id}/edit`, {
                        replace : true,
                        state : { ...((location.state as object) ?? {}), pendingUpload : file ?? undefined },
                    });
                    return;
                }
                syncWithSaved();
                toast.success(saved.status === 'draft' ? 'Draft saved' : 'Changes saved');
                return;
            }

            // 2. submit or publish
            try {
                await transitionMutation.mutateAsync({ id : saved.id, transition : intent });
                toast.success(intent === 'publish' ? 'Video published' : 'Video submitted for review');
                leaveTo(returnTo);
            } catch (error) {
                handleMutationError(error);
                if (!initialVideo) {
                    toast.warning('Your video was saved as a draft. You can submit it from its edit page.');
                    leaveTo(`/videos/${saved.id}/edit`, { replace : true, state : location.state });
                } else {
                    toast.warning('Your changes were saved, but the status was not changed.');
                    syncWithSaved();
                }
            }
        }
    });

        useEffect(()=>{
            if (handedOverFile) {
                const { pendingUpload:_, ...rest } = (location.state ?? {}) as Record<string, unknown>;
                navigate(location.pathname, { replace : true, state : rest });
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },[])

    const handleSave = (intent:SaveIntent) => {
        intentRef.current = intent;
        form.handleSubmit();
    }

        // choosing a file on a new video saves the draft, then the upload starts
    const handlePickNewFile = async (file:File | undefined) => {
        if (!file) return;
        const check = await checkVideoFile(file);
        if (!check.ok) {
            setFieldErrors((current)=>({ ...current, media : check.error }));
            return;
        }
        setFieldErrors(({media:_, ...rest})=>rest);
        pendingFileRef.current = file;
        setPendingFileName(file.name);
        handleSave('save');   // a title is needed, as for any save
    }

    // unsaved changes
    const currentValues = useSelector(form.store, (state)=>state.values);
    const isSubmitting = useSelector(form.store, (state)=>state.isSubmitting);
    const hasUnsavedChanges = JSON.stringify(currentValues) !== JSON.stringify(baseline);

    useUnSavedChangesWarning((hasUnsavedChanges && !isSubmitting) || isUploading);

    const blocker = useBlocker(({ currentLocation, nextLocation }) =>
        (hasUnsavedChanges || isUploading) &&
        !allowLeaveRef.current &&
        currentLocation.pathname !== nextLocation.pathname &&
        nextLocation.pathname !== '/login'
    );

    const handleLeave = () => navigate(returnTo);

    const sourceType = currentValues.source_type;
    const showRejectionReason = currentVideo?.status === 'rejected' && Boolean(currentVideo?.rejection_reason);

        // a new upload video can't be submitted yet: the file uploads after the draft exists
    const isNewUpload = !isEditing && sourceType === 'upload';
    const showNextAction = Boolean(nextTransition) && !isNewUpload;
    const saveButtonLabel = isNewUpload && pendingFileName ? 'Save draft and upload' : saveLabel;

    // the saved embed preview only matches the field while the link is unchanged
    const linkUnchanged = currentValues.source_url.trim() === (currentVideo?.source_url ?? '');
    const showEmbedPreview = sourceType === 'embed' && Boolean(currentVideo?.player_url) && linkUnchanged;

  return (
    <div className="flex flex-col gap-6">
        <button
            type="button"
            onClick={handleLeave}
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
            <ArrowLeft size={16} />
            {backLabel}
        </button>

        <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold capitalize sm:text-3xl">
                {isEditing ? 'edit video' : 'create video'}
            </h1>
            {currentVideo?.status && <BlogStatusBadge status={currentVideo.status} />}
        </div>

        {showRejectionReason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">{currentVideo?.rejection_reason}</p>
            </div>
        )}

        {isEditingOthersContent && (
            <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600">
                <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <p>
                    You're editing <span className="font-medium capitalize">{initialVideo?.contributor_name}</span>'s video.
                    Your changes will appear in its activity history.
                </p>
            </div>
        )}

        <form
            onSubmit={(e)=>{ e.preventDefault(); handleSave('save'); }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
            noValidate
        >
            {/* ── main column: title, description, the video ── */}
            <div className="flex min-w-0 flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">

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
                                placeholder="e.g. Sunrise on Mount Maunganui"
                                maxLength={TITLE_MAX}
                                className={`${inputClass} text-base font-medium`}
                            />
                            {field.state.meta.errors.map((error, index)=>(
                                <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                            ))}
                            {apiFieldErrors.title && <p className={errorClass}>{apiFieldErrors.title}</p>}
                        </div>
                    )}
                </form.Field>

                <form.Field name="description">
                    {(field)=>(
                        <div>
                            <label htmlFor="description" className={labelClass}>Description</label>
                            <textarea
                                id="description"
                                rows={5}
                                value={field.state.value}
                                onChange={(e)=>{
                                    field.handleChange(e.target.value);
                                    setFieldErrors(({description:_, ...rest})=>rest);
                                }}
                                onBlur={field.handleBlur}
                                placeholder="What's in this video? Where was it filmed?"
                                maxLength={DESCRIPTION_MAX}
                                className={inputClass}
                            />
                            <p className="mt-1.5 text-right text-xs text-gray-400">
                                {field.state.value.length}/{DESCRIPTION_MAX}
                            </p>
                            {field.state.meta.errors.map((error, index)=>(
                                <p key={index} className={errorClass}>{getErrorMessage(error)}</p>
                            ))}
                            {fieldErrors.description && <p className={errorClass}>{fieldErrors.description}</p>}
                            {apiFieldErrors.description && <p className={errorClass}>{apiFieldErrors.description}</p>}
                        </div>
                    )}
                </form.Field>

                {/* the video: link or file */}
                <div className="border-t border-gray-100 pt-5">
                    {sourceType === 'embed' ? (
                        <form.Field name="source_url">
                            {(field)=>(
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="source_url" className={labelClass}>Video link</label>
                                        <input
                                            id="source_url"
                                            type="url"
                                            inputMode="url"
                                            value={field.state.value}
                                            onChange={(e)=>{
                                                field.handleChange(e.target.value);
                                                setFieldErrors(({source_url:_, ...rest})=>rest);
                                            }}
                                            onBlur={field.handleBlur}
                                            placeholder="https://www.youtube.com/watch?v=…"
                                            className={inputClass}
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500">
                                            A public video on YouTube, Vimeo, TikTok or Instagram. Checked when you save.
                                        </p>
                                        {fieldErrors.source_url && <p className={errorClass}>{fieldErrors.source_url}</p>}
                                        {apiFieldErrors.source_url && <p className={errorClass}>{apiFieldErrors.source_url}</p>}
                                    </div>

                                    {showEmbedPreview && currentVideo ? (
                                        <VideoPlayer video={currentVideo} />
                                    ) : field.state.value.trim() ? (
                                        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                                            Save to check this link and see a preview.
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        </form.Field>
                    ) : (
                                                <div className="space-y-3">
                            <span className={labelClass}>Video file</span>

                            {currentVideo ? (
                                <VideoUploader
                                    video={currentVideo}
                                    disabled={isSubmitting}
                                    onBusyChange={handleUploadBusyChange}
                                    autoStartFile={handedOverFile}
                                />
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-gray-400">
                                    <Upload size={28} className="text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {pendingFileName
                                            ? <>Ready to upload <span className="font-medium">{pendingFileName}</span>. Add a title, then save the draft.</>
                                            : 'Choose a video. The draft is saved first, then the upload starts.'}
                                    </span>
                                    <span className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                                        Choose video
                                    </span>
                                    <span className="text-xs text-gray-400">MP4 or MOV · up to 60 seconds · max 500 MB</span>
                                    <input
                                        type="file"
                                        accept="video/mp4,video/quicktime,.mp4,.mov,.m4v"
                                        className="hidden"
                                        disabled={isSubmitting}
                                        onChange={(e)=>{ handlePickNewFile(e.target.files?.[0]); e.target.value = ''; }}
                                    />
                                </label>
                            )}

                            {fieldErrors.media && <p className={errorClass}>{fieldErrors.media}</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* ── side panel: settings + actions ── */}
            <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6 lg:self-start">

                {/* type: chosen once */}
                <form.Field name="source_type">
                    {(field)=>(
                        <div>
                            <span className={labelClass}>Type</span>
                            {isEditing ? (
                                <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                                    {sourceType === 'upload' ? <Upload size={16} /> : <Link2 size={16} />}
                                    {sourceType === 'upload' ? 'Uploaded video' : 'Embedded link'}
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Video type">
                                    {SOURCE_TYPE_OPTIONS.map((option)=>{
                                        const selected = field.state.value === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                role="radio"
                                                aria-checked={selected}
                                                onClick={()=>field.handleChange(option.value)}
                                                disabled={isSubmitting}
                                                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                                                    selected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{option.icon}</span>
                                                <span>
                                                    <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                                                    <span className="block text-xs text-gray-500">{option.description}</span>
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </form.Field>

                <form.Field name="thumbnail">
                    {(field)=>(
                        <div>
                            <CoverImageField
                                label="Thumbnail"
                                altInputId="thumbnail-alt"
                                value={field.state.value}
                                onChange={(next)=>{
                                    if (next && !(next.id in storedAltRef.current)) {
                                        storedAltRef.current[next.id] = next.alt_text;
                                    }
                                    field.handleChange(next);
                                    setFieldErrors(({thumbnail:_, ...rest})=>rest);
                                }}
                                error={fieldErrors.thumbnail || apiFieldErrors.thumbnail}
                                disabled={isSubmitting}
                            />
                            <p className="mt-1.5 text-xs text-gray-500">Shown on video cards. Required before submitting.</p>
                        </div>
                    )}
                </form.Field>

                <form.Field name="category">
                    {(field)=>(
                        <div>
                            <label htmlFor="category" className={labelClass}>Category</label>
                            <select
                                id="category"
                                value={field.state.value}
                                onChange={(e)=>{
                                    field.handleChange(e.target.value);
                                    setFieldErrors(({category:_, ...rest})=>rest);
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
                            {fieldErrors.category && <p className={errorClass}>{fieldErrors.category}</p>}
                            {apiFieldErrors.category && <p className={errorClass}>{apiFieldErrors.category}</p>}
                        </div>
                    )}
                </form.Field>

                {/* actions */}
                                {/* actions */}
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                    {showNextAction && nextTransition && (
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
                        {isSubmitting && !showNextAction ? 'Saving...' : saveButtonLabel}
                    </button>

                    <button
                        type="button"
                        onClick={handleLeave}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    {isNewUpload && (
                        <p className="flex items-start gap-2 pt-1 text-xs leading-5 text-gray-500">
                            <Info size={14} className="mt-0.5 shrink-0 text-gray-400" />
                            You can {isAdmin ? 'publish' : 'submit'} once the video has finished uploading and processing.
                        </p>
                    )}
                </div>
            </div>
        </form>

        <ConfirmDialog
            isOpen={blocker.state === 'blocked'}
            title={isUploading ? 'cancel upload?' : 'discard changes?'}
            description={isUploading
                ? 'An upload is in progress. Leaving now will cancel it.'
                : 'You have unsaved changes. If you leave now, they will be lost.'}
            confirmText={isUploading ? 'leave and cancel' : 'discard'}
            variant="danger"
            onConfirm={()=>blocker.proceed?.()}
            onClose={()=>blocker.reset?.()}
        />
    </div>
  )
}

export default VideoForm