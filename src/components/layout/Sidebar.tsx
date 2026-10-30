import React from 'react'
import { Link,useLocation } from 'react-router-dom'
import {LayoutDashboard,Video,FileText,Tags,Users,Settings} from 'lucide-react'
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

const Sidebar = () => {
    const location = useLocation()
  return (
    <aside className='flex flex-col min-h-screen w-64 shrink-0 bg-ink text-white px-4 py-6'>
        <div className="mb-10 px-3">
            <img
                src={logo}
                alt="Unbox logo"
                className="h-auto w-32 object-contain"
            />
            <p className="mt-1 text-xs text-soft font-semibold uppercase tracking-wider">studio</p>
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

        <div className="mb-3 w-full">
            <LogoutButton/>
        </div>

        <div className="border-t border-white/10 pt-4 tracking-wide">
            <p className="px-3 text-xs text-soft">Unbox Studio</p>
            <p className="px-3 pt-1 text-xs text-soft">Content Management</p>
        </div>
      
    </aside>
  )
}

export default Sidebar
