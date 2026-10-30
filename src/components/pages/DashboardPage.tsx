import React from 'react'
import LogoutButton from '../ui/LogoutButton'
import { useAuth } from '../../contexts/AuthContext'
import {
  Video,
  FileText,
  Clock,
  CheckCircle,
  Plus,
  ArrowUpRight,
} from "lucide-react";

const DashboardPage = () => {
  const {user} = useAuth();
  const isAdmin = user?.role === 'admin'

  const stats =[
    {
      label : isAdmin ? 'Total videos' : 'my videos',
      value : '128',
      icon : Video
    },
    {
      label: isAdmin ? "Total Blogs" : "My Blogs",
      value: "42",
      icon: FileText,
    },
    {
      label: "Pending Review",
      value: "12",
      icon: Clock,
    },
    {
      label: "Published",
      value: "156",
      icon: CheckCircle,
    },
    
  ]
  return (
    <div className='flex flex-col gap-8'>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl capitalize">
          welcome back, <span className="text-violet"> {user?.name} </span>!
        </h1>
        <p className="text-sm text-gray-700 capitalize tracking-wide"> Here's what's happening with your content today.</p>
      </div>

      {/* quick actions */}
      <div className="flex flex-wrap gap-3">
        <button className="flex gap-2 cursor-pointer items-center bg-violet rounded-lg px-4 py-3 font-semibold capitalize text-white hover:bg-violet-deep">
          <Plus size={18} /> submit video
        </button>
        <button className="flex gap-2 cursor-pointer  items-center bg-violet rounded-lg px-4 py-3 font-semibold capitalize text-white hover:bg-violet-deep">
          <Plus size={18} /> submit blog
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats?.map((item)=>{
          const Icon = item.icon;
          return(
            <div key={item.label} className="bg-white flex flex-col gap-3 border-gray-300 p-4 shadow-xl border rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 capitalize">
                  {item.label}
                </p>
                <div className="bg-lightbg p-2 text-violet rounded-xl ">
                  <Icon size={20}/>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-ink">
                {item.value}
              </h1>
            </div>
          )
        })}

      </div>

      {/* recent activity */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-5">
        
      </div>
      
    </div>
  )
}

export default DashboardPage
