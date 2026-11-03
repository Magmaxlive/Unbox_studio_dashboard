import axios from "axios";
import { getCsrfHeaders } from "./csrf";

export async function refreshSession(): Promise<void>{
    const headers = await getCsrfHeaders();

    await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh/`,{},{
            headers,
            withCredentials:true,
        }
    )
}