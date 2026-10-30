import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {LogOut} from 'lucide-react'

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
    <button type='button' onClick={handleLogout} className='cursor-pointer font-semibold capitalize w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-white hover:text-red-600'>
      <LogOut/>
      <span>Logout</span>
    </button>
  )
}

export default LogoutButton
