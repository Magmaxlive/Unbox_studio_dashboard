import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { Outlet } from 'react-router-dom'

const DashboardLayout = () => {
  return (
    <div className='flex min-h-screen bg-[#F7F7FA]'>
        <Sidebar/>

        <div className="flex min-w-0 flex-1 flex-col">
            <Header/>

            <main className="flex-1 p-8">
                <Outlet/>
            </main>
        </div>
      
    </div>
  )
}

export default DashboardLayout
