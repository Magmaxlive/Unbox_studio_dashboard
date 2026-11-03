import api from "./axios";
import { clearCsrfToken,getCsrfHeaders } from "./csrf";
import { refreshSession } from "./refresh";
export { refreshSession };

// user type
export interface AuthUser{
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'contributor';
}

// login response type
interface LoginResponse {
    message: string;
}

// login api call
export async function login(email: string,password: string) : Promise<void> {
    const headers = await getCsrfHeaders();

    await api.post<LoginResponse>(
        '/auth/login/',
        {email,password},
        {headers}
    );
   
}


// current user api call
export async function getCurrentUser(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/auth/me/')
    return response.data;
}


// logout api call
export async function logout():Promise<void> {
    try {
        const headers = await getCsrfHeaders()
        await api.post('/auth/logout/',{},{headers})
    } finally{
        clearCsrfToken();
    }
}