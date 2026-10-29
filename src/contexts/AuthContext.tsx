import { createContext,useCallback,useContext,useEffect,useState, type ReactNode } from "react";
import * as authApi from '../api/auth'
import { type AuthUser } from "../api/auth";

// contextvalue type

interface AuthContextValue{
    user : AuthUser | null;
    isLoading : boolean;
    isAuthenticated : boolean;
    login : (email:string,password:string) => Promise<void>;
    refreshUser : () => Promise<void>;
    logout : () => Promise<void>;
}

// auth variable
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// authprovider props type
interface AuthProviderProps {
    children : ReactNode
}

export function AuthProvider({children}:AuthProviderProps){
    const [user,setUser] = useState <AuthUser | null>(null)
    const [isLoading,setIsloading] = useState(true)

    // setting current user
    const refreshUser = useCallback(async ()=>{
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser as AuthUser)
    },[])

    useEffect(()=>{
        let active = true;

        async function restoreSession() {
            try {
                const currentUser = await authApi.getCurrentUser()

                if (active){
                    setUser (currentUser as AuthUser)
                }
            } catch {
                if (active){
                    setUser(null)
                }
            }finally{
                if (active){
                    setIsloading(false)
                }
            }
        }

        void restoreSession();

        return ()=>{
            active = false
        }
    },[]);


    // login
    const login = useCallback(
        async(email:string,password:string) => {
            await authApi.login(email,password);
            await refreshUser();
    },[refreshUser])

    // logout
    const logout = useCallback(
        async() => {
            try {
                await authApi.logout();
            } finally {
                setUser(null)
            }
    },[]);

    const value : AuthContextValue = {
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshUser
    };

    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    const context = useContext(AuthContext);

    if (!context){
        throw new Error ('useAuth must be used inside Authprovider')
    }

    return context;
}