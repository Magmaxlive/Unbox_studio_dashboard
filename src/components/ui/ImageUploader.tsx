import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useImageUpload, IMAGE_UPLOAD_TYPES } from '../../hooks/useImageUpload'
import type { MediaAsset } from '../../types/Media'

interface ImageUploaderProps {
    onUploaded : (asset:MediaAsset) => void;
    disabled? : boolean;
}

const ImageUploader = ({ onUploaded, disabled = false }:ImageUploaderProps) => {
    const { state, upload, cancel, reset } = useImageUpload();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging,setIsDragging] = useState(false);

    const isBusy = state.status === 'uploading' || state.status === 'processing';

    const handleFile = async (file:File | undefined) => {
        if (!file || disabled || isBusy) return;
        const asset = await upload(file);
        if (asset) {
            onUploaded(asset);
            reset();   // the parent shows the chosen image from here on
        }
    }

    // ── uploading / processing ──
    if (state.status === 'uploading' || state.status === 'processing') {
        return (
            <div className="relative overflow-hidden rounded-lg border border-gray-200">
                <img src={state.previewUrl} alt="" className="aspect-video w-full object-cover opacity-60" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 p-4">
                    {state.status === 'uploading' ? (
                        <>
                            <p className="text-sm font-medium text-gray-800">Uploading... {state.progress}%</p>
                            <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full rounded-full bg-gray-900 transition-[width]"
                                    style={{ width : `${state.progress}%` }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={cancel}
                                className="mt-1 flex cursor-pointer items-center gap-1 rounded-md bg-gray-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-600"
                            >
                                <X size={12} /> Cancel
                            </button>
                        </>
                    ) : (
                        <p className="flex items-center gap-2 text-sm font-medium text-gray-800">
                            <Loader2 size={16} className="animate-spin" /> Processing...
                        </p>
                    )}
                </div>
            </div>
        )
    }

    // ── idle / error: drop zone ──
    return (
        <div>
            <button
                type="button"
                disabled={disabled}
                onClick={()=>inputRef.current?.click()}
                onDragOver={(e)=>{ e.preventDefault(); setIsDragging(true); }}
                onDragLeave={()=>setIsDragging(false)}
                onDrop={(e)=>{
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files[0]);
                }}
                className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}
            >
                <ImagePlus size={22} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Drop an image or click to choose</span>
                <span className="text-xs text-gray-500">JPEG, PNG or WebP, up to 10 MB</span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept={IMAGE_UPLOAD_TYPES.join(',')}
                className="hidden"
                onChange={(e)=>{
                    handleFile(e.target.files?.[0]);
                    // allow choosing the same file again after an error
                    e.target.value = '';
                }}
            />

            {state.status === 'error' && (
                <p className="mt-2 text-xs text-red-600" role="alert">{state.message}</p>
            )}
        </div>
    )
}

export default ImageUploader