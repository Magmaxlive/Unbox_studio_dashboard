import React from 'react'
import { Link,useLocation } from 'react-router-dom'
import {LayoutDashboard,Video,FileText,Tags,Users,Settings,X} from 'lucide-react'
import logo from '../../assets/images/logo.png'
import LogoutButton from '../ui/LogoutButton';

const menuItems = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Videos", path: "/videos", icon: Video },
  { label: "Blogs", path: "/blogs", icon: FileText },
  { label: "Categories", path: "/categories", icon: Tags },
  { label: "Users", path: "/users", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

interface SidebarProps{
    isOpen:boolean
    onClose:()=>void
}

const Sidebar = ({isOpen,onClose}:SidebarProps) => {
    const location = useLocation()
  return (
    <>
    {isOpen && (
         <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
    )}
    <aside className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          bg-ink px-4 py-6 text-white
          transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:z-auto lg:min-h-dvh lg:translate-x-0
          ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }
        `}>


        {/* Logo */}
        <div className="mb-10 flex items-start justify-between px-3">
          <div>
            <img
              src={logo}
              alt="Unbox logo"
              className="h-auto w-32 object-contain"
            />
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-soft">
              Studio
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-soft transition hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
            {menuItems.map((item)=>{
                const Icon = item.icon;
                return(
                    <Link to={item.path} key={item.path} className={`flex tracking-wide items-center gap-4 text-soft rounded-md p-3 text font-medium transition hover:bg-violet hover:text-white ${location.pathname === item.path && 'bg-violet'}`}>
                        <Icon size={18}/>
                        {item.label}
                    </Link>
                )
            })}
        </nav>

        {/* <div className="mb-3 w-full">
            <LogoutButton/>
        </div> */}

        <div className="border-t border-white/10 pt-4 tracking-wide">
            <p className="px-3 text-xs text-soft">Unbox Studio</p>
            <p className="px-3 pt-1 text-xs text-soft">Content Management</p>
        </div>
      
    </aside>
    </>
  )
}

export default Sidebar
