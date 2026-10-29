import api from "./axios";
import { clearCsrfToken,getCsrfHeaders } from "./csrf";

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
