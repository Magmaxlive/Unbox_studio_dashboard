export interface UserFilter {
    page ? : number;
    search ? : string;
}

export interface User{
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'contributor';
}