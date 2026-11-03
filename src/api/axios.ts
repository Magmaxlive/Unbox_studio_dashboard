import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { refreshSession } from "./refresh";

const api = axios.create({
    baseURL : import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if(
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry
        ){
            return Promise.reject(error)
        }

        // dont do refreshing when login, refresh or logout fails
        const url = originalRequest.url ?? "";

        if (url.includes('/auth/login/') || url.includes('/auth/token/refresh/') || url.includes('/auth/logout/')){
            return Promise.reject(error)
        }

        originalRequest._retry = true;

        try {
        //    share one refresh request between  simultaneous 401 response
            if (!refreshPromise){
                refreshPromise = refreshSession().finally(()=>{
                    refreshPromise = null;
                });
            }

            await refreshPromise;

            // retry the original request with the refreshed cookie.
            return api(originalRequest);
        } catch (refreshError) {
            return Promise.reject(refreshError)
        }
    }
);

export default api;