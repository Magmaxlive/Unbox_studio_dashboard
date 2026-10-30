import React from 'react'
import { Link } from 'react-router-dom'
import {LayoutDashboard,Video,FileText,Tags,Users,Settings} from 'lucide-react'
import logo from '../../assets/images/logo.png'

const menuItems = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Videos", path: "/videos", icon: Video },
  { label: "Blogs", path: "/blogs", icon: FileText },
  { label: "Categories", path: "/categories", icon: Tags },
  { label: "Users", path: "/users", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

const Sidebar = () => {
  return (
    <aside className='flex flex-col w-64 shrink-0 bg-[#111111] text-white px-4 py-6'>
        <div className="mb-10px-3">
            <img
                src={logo}
                alt="Unbox logo"
                className="h-auto w-32 object-contain"
            />
            <p className="mt-1 text-xs text-soft uppercase">studio</p>
        </div>

        <nav className="flex-1 space-y-1">
            {menuItems.map((item)=>{
                const Icon = item.icon;
                return(
                    <Link to={item.path} key={item.path} className='flex items-center gap-3 text-soft rounded-md p-3 text-sm font-medium transition hover:bg-soft hover:text-white'>
                        <Icon size={10}/>
                        {item.label}
                    </Link>
                )
            })}
        </nav>

        <div className="border-t border-white/10 pt-4">
            <p className="px-3 text-xs text-white/40">Unbox Studio</p>
            <p className="px-3 pt-1 text-xs text-white/30">Content Management</p>
        </div>
      
    </aside>
  )
}

export default Sidebar
