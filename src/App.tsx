
import './App.css'
import LoginPage from './components/auth/pages/LoginPage'
import { Route,Routes } from 'react-router-dom'
import ProtectedRoutes from './components/auth/ProtectedRoutes'
import DashboardPage from './components/pages/DashboardPage'
import Unauthorized from './components/pages/Unauthorized'
import NotFound from './components/pages/NotFound'

function App() {
  

  return (
    <Routes>
      <Route path='/login' element={<LoginPage/>}  />
      <Route path='/unauthorized' element={<Unauthorized/>}  />

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
