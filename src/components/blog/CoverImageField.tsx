import { useState } from 'react'
import ImageUploader from '../ui/ImageUploader'
import MediaPickerModal from './MediaPIckerModal'
import type { CoverImageValue } from '../../schemas/blog/BlogSchema'
import type { MediaAsset } from '../../types/Media'

interface CoverImageFieldProps {
    value : CoverImageValue | null;
    onChange : (value:CoverImageValue | null) => void;
    error? : string;
    disabled? : boolean;
    label?:string;
    altInputId?:string;
}

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700"

const toCoverValue = (asset:MediaAsset) : CoverImageValue => ({
    id : asset.id,
    url : asset.url,
    thumbnail_url : asset.thumbnail_url,
    alt_text : asset.alt_text,
});

const CoverImageField = ({ value, onChange, error, disabled = false , label ='Cover image' ,altInputId = 'cover-alt' }:CoverImageFieldProps) => {
    const [isPickerOpen,setIsPickerOpen] = useState(false);
    // replacing: show the uploader/picker while keeping the current cover until a new one is chosen
    const [isReplacing,setIsReplacing] = useState(false);

    const choose = (asset:MediaAsset) => {
        onChange(toCoverValue(asset));
        setIsReplacing(false);
        setIsPickerOpen(false);
    }

    const previewSrc = value?.thumbnail_url ?? value?.url;

  return (
    <div>
        <span className={labelClass}>{label}</span>

        {value && !isReplacing ? (
            <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    {previewSrc ? (
                        <img src={previewSrc} alt={value.alt_text} className="aspect-video w-full object-cover" />
                    ) : (
                        <div className="flex aspect-video items-center justify-center text-xs text-gray-400">
                            Preview unavailable
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={()=>setIsReplacing(true)}
                        disabled={disabled}
                        className="flex-1 cursor-pointer rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Replace
                    </button>
                    <button
                        type="button"
                        onClick={()=>onChange(null)}
                        disabled={disabled}
                        className="flex-1 cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Remove
                    </button>
                </div>

                <div>
                    <label htmlFor={altInputId} className={labelClass}>Alt text</label>
                    <input
                        id={altInputId}
                        type="text"
                        value={value.alt_text}
                        onChange={(e)=>onChange({ ...value, alt_text : e.target.value })}
                        maxLength={300}
                        disabled={disabled}
                        placeholder="e.g. Coastal walking track at sunrise"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Describes the image for screen readers and search engines.
                    </p>
                </div>
            </div>
        ) : (
            <div className="space-y-2">
                <ImageUploader disabled={disabled} onUploaded={choose} />

                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={()=>setIsPickerOpen(true)}
                        disabled={disabled}
                        className="cursor-pointer text-sm font-medium text-blue-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Choose from library
                    </button>
                    {isReplacing && (
                        <button
                            type="button"
                            onClick={()=>setIsReplacing(false)}
                            className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-900"
                        >
                            Keep current
                        </button>
                    )}
                </div>
            </div>
        )}

        {error && <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>}

        <MediaPickerModal
            isOpen={isPickerOpen}
            selectedId={value?.id}
            onClose={()=>setIsPickerOpen(false)}
            onSelect={choose}
        />
    </div>
  )
}

export default CoverImageField