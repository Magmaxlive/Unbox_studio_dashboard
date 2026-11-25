import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    abortVideoUpload,
    completeVideoUpload,
    signVideoParts,
    startVideoUpload,
    type UploadedPart,
} from '../api/media'
import { videoKeys } from './queries/videos'
import { checkVideoFile  } from '../utlis/videoFile'
import { getApiErrorMessage } from '../utlis/getApiErrorMessage'

const PARALLEL_PARTS = 3;
const MAX_ATTEMPTS = 3;

export type UploadPhase = 'idle' | 'checking' | 'uploading' | 'completing' | 'error';

interface UploadState {
    phase : UploadPhase;
    progress : number;     // 0-100
    fileName : string;
    error : string;
}

const IDLE : UploadState = { phase : 'idle', progress : 0, fileName : '', error : '' };

const wait = (ms:number) => new Promise((resolve)=>setTimeout(resolve, ms));

// Multipart upload of one video file, straight to S3 (see V3 for the backend).
export function useVideoUpload(videoId:string) {
    const queryClient = useQueryClient();
    const [state, setState] = useState<UploadState>(IDLE);

    const controllerRef = useRef<AbortController | null>(null);
    const assetIdRef = useRef<string | null>(null);   // set while S3 holds unfinished parts

    const refreshVideo = useCallback(()=>{
        queryClient.invalidateQueries({ queryKey : videoKeys.detail(videoId) });
        queryClient.invalidateQueries({ queryKey : videoKeys.lists() });
    }, [queryClient, videoId]);

    // tell the backend to discard unfinished parts (best effort)
    const abortOnServer = useCallback(async ()=>{
        const assetId = assetIdRef.current;
        assetIdRef.current = null;
        if (assetId) {
            await abortVideoUpload(assetId).catch(()=>{});
        }
    }, []);

    const start = useCallback(async (file:File)=>{
        setState({ ...IDLE, phase : 'checking', fileName : file.name });

        // 1. browser-side checks: instant feedback
        const check = await checkVideoFile(file);
        if (!check.ok) {
            setState({ ...IDLE, phase : 'error', fileName : file.name, error : check.error });
            return;
        }

        const controller = new AbortController();
        controllerRef.current = controller;
        setState({ ...IDLE, phase : 'uploading', fileName : file.name });

        try {
            // 2. start: the backend creates the asset and attaches it to the video
            const { asset, part_size, part_count } = await startVideoUpload({
                video : videoId,
                file_name : file.name,
                file_size : file.size,
                mime_type : check.mimeType,
            });
            assetIdRef.current = asset.id;
            refreshVideo();

            // 3. upload the parts, a few at a time
            const loadedPerPart = new Array<number>(part_count).fill(0);
            const reportProgress = () => {
                const loaded = loadedPerPart.reduce((sum, bytes)=>sum + bytes, 0);
                // 99% max until the backend confirms completion
                const progress = Math.min(99, Math.round((loaded / file.size) * 100));
                setState((current)=>({ ...current, progress }));
            };

            const uploaded : UploadedPart[] = [];
            const queue = Array.from({ length : part_count }, (_, index)=>index + 1);

            const uploadPart = async (partNumber:number) => {
                const blob = file.slice((partNumber - 1) * part_size, Math.min(partNumber * part_size, file.size));

                for (let attempt = 1; ; attempt++) {
                    try {
                        // a fresh signed URL per attempt: nothing expires on slow connections
                        const [{ url }] = await signVideoParts(asset.id, [partNumber]);

                        // plain axios: S3, not our API (no cookies, no CSRF header)
                        const response = await axios.put(url, blob, {
                            signal : controller.signal,
                            onUploadProgress : (event)=>{
                                loadedPerPart[partNumber - 1] = event.loaded;
                                reportProgress();
                            },
                        });

                        const etag = response.headers['etag'];
                        if (!etag) {
                            // the bucket's CORS must expose the ETag header
                            throw new Error('The upload could not be confirmed (missing ETag).');
                        }

                        loadedPerPart[partNumber - 1] = blob.size;
                        reportProgress();
                        uploaded.push({ part_number : partNumber, etag });
                        return;
                    } catch (error) {
                        if (controller.signal.aborted || attempt >= MAX_ATTEMPTS) throw error;
                        loadedPerPart[partNumber - 1] = 0;
                        await wait(1000 * 2 ** (attempt - 1));    // 1 s, 2 s
                    }
                }
            };

            const worker = async () => {
                while (queue.length) {
                    if (controller.signal.aborted) return;
                    const partNumber = queue.shift();
                    if (partNumber !== undefined) await uploadPart(partNumber);
                }
            };

            await Promise.all(Array.from({ length : Math.min(PARALLEL_PARTS, part_count) }, worker));
            if (controller.signal.aborted) return;

            // 4. complete: the backend joins the parts, checks them, starts processing
            setState((current)=>({ ...current, phase : 'completing', progress : 100 }));
            await completeVideoUpload(asset.id, uploaded);
            assetIdRef.current = null;

            setState(IDLE);
            toast.success('Upload complete. The video is being processed.');
            refreshVideo();
        } catch (error) {
            if (controller.signal.aborted) return;   // cancelled: handled by cancel()

            await abortOnServer();
            setState({
                ...IDLE,
                phase : 'error',
                fileName : file.name,
                error : axios.isAxiosError(error) && error.response
                    ? getApiErrorMessage(error)
                    : (error instanceof Error ? error.message : 'The upload failed. Please try again.'),
            });
            refreshVideo();
        } finally {
            if (controllerRef.current === controller) controllerRef.current = null;
        }
    }, [videoId, refreshVideo, abortOnServer]);

    const cancel = useCallback(async ()=>{
        controllerRef.current?.abort();
        controllerRef.current = null;
        await abortOnServer();
        setState(IDLE);
        toast.info('Upload cancelled');
        refreshVideo();
    }, [abortOnServer, refreshVideo]);

    const dismissError = useCallback(()=>setState(IDLE), []);

    // leaving the page mid-upload: stop the parts and discard them on S3
    useEffect(()=>()=>{
        if (controllerRef.current) {
            controllerRef.current.abort();
            const assetId = assetIdRef.current;
            if (assetId) abortVideoUpload(assetId).catch(()=>{});
        }
    }, []);

    const isBusy = state.phase === 'checking' || state.phase === 'uploading' || state.phase === 'completing';

    return { ...state, isBusy, start, cancel, dismissError };
}