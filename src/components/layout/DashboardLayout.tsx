import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { Outlet } from 'react-router-dom'

const DashboardLayout = () => {
    const [sidebarOpen,setSidebarOpen] = useState(false)
  return (
    <div className='flex min-h-screen bg-[#F7F7FA]'>
        <Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
            <Header onMenuClick = {()=>setSidebarOpen(true)} />

            <main className="flex-1 p-8 bg-[#F3F4F6]">
                <Outlet/>
            </main>
        </div>
      
    </div>
  )
}

export default DashboardLayout
