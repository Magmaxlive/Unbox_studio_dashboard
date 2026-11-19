export type UserRole = 'admin' | 'contributor';

export interface UserFilter {
    page ? : number;
    search ? : string;
    role? : UserRole;
}

export interface User{
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'contributor';
}