
import './App.css'
import LoginPage from './components/auth/pages/LoginPage'
import { Route,Routes } from 'react-router-dom'
import ProtectedRoutes from './components/auth/ProtectedRoutes'
import DashboardPage from './components/pages/DashboardPage'
import Unauthorized from './components/pages/Unauthorized'
import NotFound from './components/pages/NotFound'
import GuestRoute from './components/auth/GuestRoute'

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
        <Route path='/dashboard'  element={<DashboardPage/>} />
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
