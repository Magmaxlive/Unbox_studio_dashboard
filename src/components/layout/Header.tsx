import React, { useState,useEffect,useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Bell,ChevronDown,User,Settings,Menu } from 'lucide-react'
import LogoutButton from '../ui/LogoutButton'
import { Link } from 'react-router-dom'

interface HeaderProps{
    onMenuClick: ()=> void
}

const Header = ({onMenuClick}:HeaderProps) => {
    const {user} = useAuth();
    const [profileOpen,setProfileOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
        ) {
        setProfileOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
    }, []);
  return (
    <div className='flex justify-between items-center border-b border-gray-200 bg-white h-20 px-4 md:px-8'>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open sidebar"
                    className="rounded-lg p-2 text-ink transition hover:bg-gray-100 lg:hidden"
                    >
                    <Menu size={22} />
                </button>

                <div className="flex flex-col">
                    <h1 className="font-bold text-lg text-ink tracking-wide capitalize">unbox studio</h1>
                    <p className="text-xs tracking-wide text-gray-500">          
                    Manage your content and submissions</p>
                </div>

            </div>
        

        <div className="flex items-center gap-3">
            <button className='rounded-full p-3 text-gray-800 transition cursor-pointer hover:bg-gray-200'
            aria-label='notifications'
            >
                <Bell size={20}/>

            </button>

            {/* profile */}
            <div className="relative" ref={profileRef}>
                <button type='button' onClick={()=>setProfileOpen(!profileOpen)} className="flex items-center gap-3 cursor-pointer rounded-xl p-2 transition hover:bg-gray-50">
                    
                        <div className="h-9 w-9 items-center flex justify-center text-sm rounded-full bg-violet text-white">
                            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                        </div>
                        <div className="hidden text-left sm:block">
                            <h3 className="font-semibold text-ink text-sm capitalize">{user?.name}</h3>
                            <h4 className="text-xs text-gray-500 capitalize">{user?.role}</h4>
                        </div>
                    
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition ${
                                profileOpen ? "rotate-180" : ""
                            }`}
                            />
                </button>

                {profileOpen && (
                    <div className="absolute font-semibold right-0 top-full p-2 flex-col gap-2 z-50 w-48 mt-1 rounded-xl border-2 border-gray-300 bg-[#EDE7FF] p-2 shadow-xl shadow-black/10">
                        <Link to='/profile' className='font-semibold cursor-pointer capitalize w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-white hover:text-blue-600'>
                            <User/> Profile
                        </Link>

                        <Link to='/settings' className='font-semibold cursor-pointer capitalize w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-white hover:text-blue-600'>
                            <Settings/> Settings
                        </Link>
                        
                        <LogoutButton/>
                    </div>
                )}
            </div>
            

            
        </div>
      
    </div>
  )
}

export default Header
