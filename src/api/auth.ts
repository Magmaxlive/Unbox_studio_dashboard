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


