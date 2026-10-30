import React from 'react'
import { Navigate,Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const GuestRoute = () => {
    const {isLoading,isAuthenticated} = useAuth();

    if (isLoading){
        return (
            <div className='min-h-screen capitalize flex items-center justify-center font-semibold'>
                checking your session...
            </div>
        )
    }

    if (isAuthenticated){
        return <Navigate to='/dashboard' replace />
    }

    return <Outlet/>
  
}

export default GuestRoute
