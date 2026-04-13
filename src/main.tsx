import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './core/i18n'
import './index.css'
import { ThemeProvider } from './core/theme/ThemeContext'
import { AuthProvider } from './core/auth/AuthContext'
import { UserProvider } from './core/user/UserContext'
import { router } from './router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
