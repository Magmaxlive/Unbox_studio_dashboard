import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import {Toaster} from 'sonner'



const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      
        <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
        </AuthProvider>
     
    </QueryClientProvider>
  </StrictMode>,
)
