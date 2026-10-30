import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const LogoutButton = () => {
    const {logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = async ()=>{
        try {
            await logout();
            navigate('/login',{replace:true})
        } catch (error) {
            console.log('Logout failed :',error)
        }
    }
  return (
    <button onClick={handleLogout} className='bg-red-700 cursor-pointer rounded-md px-3 py-2 text-white font-semibold capitalize'>
      logout
    </button>
  )
}

export default LogoutButton
