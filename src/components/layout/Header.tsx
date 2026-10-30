import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Bell } from 'lucide-react'

const Header = () => {
    const {user} = useAuth();
  return (
    <div className='flex justify-between items-center border-b border-gray-200 bg-white h-20 px-8'>
        <div className="flex flex-col">
            <h1 className="font-bold text-lg text-ink tracking-wide capitalize">unbox studio</h1>
            <p className="text-xs tracking-wide text-gray-500">          
            Manage your content and submissions</p>
        </div>

        <div className="flex items-center gap-3">
            <button className='rounded-full p-3 text-gray-800 transition cursor-pointer hover:bg-gray-200'
            aria-label='notifications'
            >
                <Bell size={20}/>

            </button>

            <div className="flex gap-3 items-center hidden sm:flex">
                <div className="h-9 w-9 items-center flex justify-center text-sm rounded-full bg-violet text-white">
                    {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="flex flex-col">
                    <h3 className="font-semibold text-ink text-sm capitalize">{user?.name}</h3>
                    <h4 className="text-xs text-gray-500 capitalize">{user?.role}</h4>
                </div>
            </div>
        </div>
      
    </div>
  )
}

export default Header
