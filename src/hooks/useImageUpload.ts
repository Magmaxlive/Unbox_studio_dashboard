import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { mediaKeys } from "./queries/media";
import type { MediaAsset } from "../types/Media";
import { getApiErrorMessage } from "../utlis/getApiErrorMessage";
import { CompleteImageUpload,requestImageUpload,UploadFileToStorage } from "../api/media";

// Mirrors MEDIA_ALLOWED_IMAGE_TYPES / MEDIA_MAX_IMAGE_BYTES in Django settings.
export const IMAGE_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export type ImageUploadState =
    | { status : 'idle' }
    | { status : 'uploading'; progress : number; fileName : string; previewUrl : string }
    | { status : 'processing'; fileName : string; previewUrl : string }
    | { status : 'ready'; asset : MediaAsset }
    | { status : 'error'; message : string };

export function validateImageFile(file:File) : string | null {
    if (!IMAGE_UPLOAD_TYPES.includes(file.type)) {
        return 'Please choose a JPEG, PNG or WebP image.';
    }
    if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
        return 'This image is larger than 10 MB. Please choose a smaller one.';
    }
    return null;
}

class StorageUploadError extends Error {}

export function useImageUpload() {
    const queryClient = useQueryClient();
    const [state,setState] = useState<ImageUploadState>({ status : 'idle' });
    const controllerRef = useRef<AbortController | null>(null);

    // cancel any upload in progress if the component using this goes away
    useEffect(()=>{
        return ()=> controllerRef.current?.abort();
    },[])

    const upload = useCallback(async (file:File) : Promise<MediaAsset | null> => {
        const invalid = validateImageFile(file);
        if (invalid) {
            setState({ status : 'error', message : invalid });
            return null;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        // local preview while uploading (no network needed)
        const previewUrl = URL.createObjectURL(file);
        setState({ status : 'uploading', progress : 0, fileName : file.name, previewUrl });

        try {
            // 1. request
            const { asset, upload : form } = await requestImageUpload(file);

            // 2. upload to S3
            try {
                await UploadFileToStorage(form, file, {
                    signal : controller.signal,
                    onProgress : (progress) =>
                        setState((current) => current.status === 'uploading' ? { ...current, progress } : current),
                });
            } catch (error) {
                if (axios.isCancel(error)) throw error;
                throw new StorageUploadError();
            }

            // 3. verify + process
            setState({ status : 'processing', fileName : file.name, previewUrl });
            const ready = await CompleteImageUpload(asset.id);

            queryClient.invalidateQueries({ queryKey : mediaKeys.lists() });
            setState({ status : 'ready', asset : ready });
            return ready;
        } catch (error) {
            if (axios.isCancel(error) || controller.signal.aborted) {
                setState({ status : 'idle' });
                return null;
            }

            const message = error instanceof StorageUploadError
                ? 'The upload did not complete. Please check your connection and try again.'
                : getApiErrorMessage(error, 'The image could not be uploaded. Please try again.');

            setState({ status : 'error', message });
            return null;
        } finally {
            URL.revokeObjectURL(previewUrl);
            if (controllerRef.current === controller) controllerRef.current = null;
        }
    },[queryClient])

    const cancel = useCallback(()=>{
        controllerRef.current?.abort();
        setState({ status : 'idle' });
    },[])

    const reset = useCallback(()=>{
        setState({ status : 'idle' });
    },[])

    return { state, upload, cancel, reset };
}