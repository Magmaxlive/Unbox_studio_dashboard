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
    <button onClick={handleLogout} className='w-full flex gap-3 bg-ink hover:bg-red-800 tracking-wide cursor-pointer rounded-md p-3 hover:text-white text-soft font-semibold capitalize'>
      <LogOut/>
      sign out
    </button>
  )
}

export default LogoutButton
