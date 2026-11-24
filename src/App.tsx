
import './App.css'
import LoginPage from './components/auth/pages/LoginPage'
import { Route,RouterProvider,createBrowserRouter,createRoutesFromElements } from 'react-router-dom'
import ProtectedRoutes from './components/auth/ProtectedRoutes'
import DashboardPage from './components/pages/DashboardPage'
import Unauthorized from './components/pages/Unauthorized'
import NotFound from './components/pages/NotFound'
import GuestRoute from './components/auth/GuestRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import CategoryPage from './components/category/pages/CategoryPage'
import BlogPage from './components/blog/pages/BlogPage'
import BlogFormPage from './components/blog/pages/BlogFormPage'
import RouteErrorPage from './components/pages/RouteErrorPage'
import UserPage from './components/users/pages/UserPage'
import VideoPage from './components/video/pages/VideoPage'


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<RouteErrorPage/>}>
      <Route path='/unauthorized' element={<Unauthorized/>}  />

      {/*guest route  */}
      <Route element={<GuestRoute/>}>
          <Route path='/login' element={<LoginPage/>}  />
      </Route>
      
      

      {/* Authenticated routes */}
      <Route element={<ProtectedRoutes/>}>
        <Route element={<DashboardLayout/>}>
          <Route errorElement={<RouteErrorPage/>}>
              <Route path='/dashboard'  element={<DashboardPage/>} />

              {/* categories */}
              <Route path='/categories'  element={<CategoryPage/>} />

              {/* blogs */}
              <Route path='/blogs'  element={<BlogPage/>} />
              <Route path='/blogs/new'  element={<BlogFormPage/>} />
              <Route path='/blogs/:id/edit'  element={<BlogFormPage/>} />

              {/* videos */}
              <Route path='/videos' element={<VideoPage/>} />

            </Route>
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoutes allowedRoles={['admin']}/>}>
       <Route element={<DashboardLayout/>}>
        <Route errorElement={<RouteErrorPage/>}>
          <Route path='/admin/users'  element={<UserPage/>} />
        </Route>
        </Route>
      </Route>

      {/* unknown routes */}
      <Route path='*' element={<NotFound/>} />
    </Route>
  )
)

function App() {
  

  return (
    <RouterProvider router={router} />
  )
}

export default App
