import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Film, Upload, X } from 'lucide-react'
import type { Video } from '../../types/Videos'
import { useVideoUpload } from '../../hooks/useVideoUpload'
import VideoPlayer from './VideoPlayer'

interface VideoUploaderProps {
    video : Video;
    disabled? : boolean;
    onBusyChange? : (busy:boolean) => void;
    // a file chosen on /videos/new: starts uploading as soon as this mounts
    autoStartFile? : File | null;
}

const ACCEPT = 'video/mp4,video/quicktime,.mp4,.mov,.m4v';

const VideoUploader = ({ video, disabled = false, onBusyChange, autoStartFile }:VideoUploaderProps) => {
    const upload = useVideoUpload(video.id);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const autoStartedRef = useRef(false);

    useEffect(()=>{
        onBusyChange?.(upload.isBusy);
    }, [upload.isBusy, onBusyChange]);

    useEffect(()=>{
        if (autoStartFile && !autoStartedRef.current) {
            autoStartedRef.current = true;
            upload.start(autoStartFile);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoStartFile]);

    const isLocked = video.status === 'published' || video.status === 'archived';
    const hasFile = Boolean(video.media);

    const pickFile = (files:FileList | null) => {
        const file = files?.[0];
        if (file && !disabled && !isLocked) upload.start(file);
        if (inputRef.current) inputRef.current.value = '';   // allow picking the same file again
    };

    // ── uploading ──
    if (upload.isBusy) {
        const label = upload.phase === 'checking'
            ? 'Checking the file…'
            : upload.phase === 'completing'
                ? 'Finishing upload…'
                : `Uploading… ${upload.progress}%`;

        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">{upload.fileName}</p>
                    </div>
                    {upload.phase === 'uploading' && (
                        <button
                            type="button"
                            onClick={upload.cancel}
                            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-gray-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-600"
                        >
                            <X size={12} /> Cancel
                        </button>
                    )}
                </div>

                <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={upload.progress}
                    aria-label="Upload progress"
                >
                    <div
                        className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                        style={{ width : `${upload.phase === 'checking' ? 0 : upload.progress}%` }}
                    />
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    Please keep this page open until the upload finishes.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {upload.phase === 'error' && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <p className="flex items-start gap-2 text-sm text-red-700">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        {upload.error}
                    </p>
                    <button
                        type="button"
                        onClick={upload.dismissError}
                        aria-label="Dismiss"
                        className="shrink-0 cursor-pointer text-red-400 hover:text-red-700"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* the current file (or its state) */}
            {hasFile && <VideoPlayer video={video} />}

            {isLocked ? (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    The video file can't be replaced after publishing. Create a new video instead.
                </p>
            ) : (
                <div
                    onDragOver={(e)=>{ e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={()=>setIsDragging(false)}
                    onDrop={(e)=>{ e.preventDefault(); setIsDragging(false); pickFile(e.dataTransfer.files); }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 text-center transition ${
                        hasFile ? 'py-5' : 'py-10'
                    } ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                >
                    {!hasFile && <Film size={28} className="text-gray-400" />}
                    <p className="text-sm text-gray-600">
                        {hasFile ? 'Drop a new file here to replace it, or' : 'Drop your video here, or'}
                    </p>
                    <button
                        type="button"
                        onClick={()=>inputRef.current?.click()}
                        disabled={disabled}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Upload size={14} />
                        {hasFile ? 'Replace video file' : 'Choose video'}
                    </button>
                    <p className="text-xs text-gray-400">MP4 or MOV · up to 60 seconds · max 500 MB</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPT}
                        className="hidden"
                        onChange={(e)=>pickFile(e.target.files)}
                    />
                </div>
            )}
        </div>
    );
}

export default VideoUploader