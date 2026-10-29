import { Navigate,Outlet,useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// type
interface protectedRouteProps{
    allowedRoles ? :Array<'admin'|'contributor'>
}

const ProtectedRoutes = ({allowedRoles}:protectedRouteProps) => {
    const {user,isLoading,isAuthenticated} = useAuth();
    const location = useLocation();

    if(isLoading){
        return (
            <div className='flex min-h-screen items-center justify-center bg-ink text-white'>
                <p className='text-white text-sm capitalize'>checking your session....</p>
            </div>
        )
    }

    if(!isAuthenticated){
        return <Navigate to='/login' replace state={{from:location}} />
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)){
        return <Navigate to='/unauthorized' replace />
    }

    return <Outlet/>
  
}

export default ProtectedRoutes
