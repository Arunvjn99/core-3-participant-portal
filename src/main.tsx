import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { initAcsbAccessibility } from './lib/initAcsbAccessibility'
import './core/i18n'
import './index.css'
import { ThemeProvider } from './core/theme/ThemeContext'
import { BrandThemeProvider } from './core/theme/BrandThemeContext'
import { AuthProvider } from './core/auth/AuthContext'
import { UserProvider } from './core/user/UserContext'
import { router } from './router'
import { GlobalFeedback } from './features/feedback/GlobalFeedback'
import { LanguageProvider } from './core/language/LanguageContext'

initAcsbAccessibility()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrandThemeProvider>
        <AuthProvider>
          <UserProvider>
            <LanguageProvider>
              <RouterProvider router={router} />
              <GlobalFeedback />
            </LanguageProvider>
          </UserProvider>
        </AuthProvider>
      </BrandThemeProvider>
    </ThemeProvider>
  </StrictMode>,
)
