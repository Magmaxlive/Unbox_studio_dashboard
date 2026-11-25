// Browser-side checks before uploading a video. They give instant feedback;
// the backend checks everything again (type, size, and length after processing).

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;   // matches MEDIA_MAX_VIDEO_BYTES
export const MAX_VIDEO_SECONDS = 60;
const MIN_VIDEO_SECONDS = 1;

// MP4 or MOV, by the browser's type or (when it doesn't say) the extension
export function getVideoMimeType(file:File) : string | null {
    if (file.type === 'video/mp4' || file.type === 'video/quicktime') return file.type;

    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'mp4' || extension === 'm4v') return 'video/mp4';
    if (extension === 'mov') return 'video/quicktime';
    return null;
}

// Length from the file's own metadata (no upload). Null if the browser
// can't read it, e.g. some iPhone MOV files in Chrome: the server still checks.
export function readVideoDuration(file:File) : Promise<number | null> {
    return new Promise((resolve)=>{
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';

        const finish = (seconds:number | null) => {
            clearTimeout(timer);
            URL.revokeObjectURL(url);
            video.removeAttribute('src');
            resolve(seconds);
        };
        const timer = window.setTimeout(()=>finish(null), 8000);

        video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? video.duration : null);
        video.onerror = () => finish(null);
        video.src = url;
    });
}

export type VideoFileCheck = { ok : true; mimeType : string } | { ok : false; error : string };

export async function checkVideoFile(file:File) : Promise<VideoFileCheck> {
    const mimeType = getVideoMimeType(file);
    if (!mimeType) return { ok : false, error : 'Choose an MP4 or MOV video.' };

    if (file.size > MAX_VIDEO_BYTES) {
        const sizeMb = Math.round(file.size / (1024 * 1024));
        return { ok : false, error : `Videos must be 500 MB or smaller. This one is ${sizeMb} MB.` };
    }

    const seconds = await readVideoDuration(file);
    if (seconds !== null) {
        // half a second of leeway: players and encoders round differently
        if (seconds > MAX_VIDEO_SECONDS + 0.5) {
            return { ok : false, error : `Videos must be ${MAX_VIDEO_SECONDS} seconds or shorter. This one is ${Math.round(seconds)} seconds.` };
        }
        if (seconds < MIN_VIDEO_SECONDS) {
            return { ok : false, error : 'This video is too short.' };
        }
    }

    return { ok : true, mimeType };
}