
import './App.css'
import LoginPage from './components/auth/pages/LoginPage'
import { Route,Routes } from 'react-router-dom'
import ProtectedRoutes from './components/auth/ProtectedRoutes'
import DashboardPage from './components/pages/DashboardPage'
import Unauthorized from './components/pages/Unauthorized'
import NotFound from './components/pages/NotFound'
import GuestRoute from './components/auth/GuestRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import CategoryPage from './components/category/pages/CategoryPage'
import BlogPage from './components/blog/pages/BlogPage'
import BlogFormPage from './components/blog/pages/BlogFormPage'

function App() {
  

  return (
    <Routes>

      <Route path='/unauthorized' element={<Unauthorized/>}  />

      {/*guest route  */}
      <Route element={<GuestRoute/>}>
          <Route path='/login' element={<LoginPage/>}  />
      </Route>
      
      

      {/* Authenticated routes */}
      <Route element={<ProtectedRoutes/>}>
        <Route element={<DashboardLayout/>}>
            <Route path='/dashboard'  element={<DashboardPage/>} />
            <Route path='/categories'  element={<CategoryPage/>} />
            <Route path='/blogs'  element={<BlogPage/>} />
            <Route path='/blogs/new'  element={<BlogFormPage/>} />
            <Route path='/blogs/:id/edit'  element={<BlogFormPage/>} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoutes allowedRoles={['admin']}/>}>
        <Route path='/admin/users'  element={<DashboardPage/>} />
      </Route>

      {/* unknown routes */}
      <Route path='*' element={<NotFound/>} />

    </Routes>
  )
}

export default App
