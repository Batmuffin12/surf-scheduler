import { useState } from 'react'
import { LoginScreen } from './LoginScreen.tsx'
import { MapScreen } from './MapScreen.tsx'

// Remember the email so a page refresh keeps you "logged in". Storage can be unavailable (private mode).
const STORAGE_KEY = 'surf-scheduler:email'

function readEmail(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeEmail(email: string | null) {
  try {
    if (email) localStorage.setItem(STORAGE_KEY, email)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Not critical: you just log in again after a refresh
  }
}

export default function App() {
  const [email, setEmail] = useState<string | null>(readEmail)

  function login(value: string) {
    writeEmail(value)
    setEmail(value)
  }

  function logout() {
    writeEmail(null)
    setEmail(null)
  }

  return email ? <MapScreen email={email} onLogout={logout} /> : <LoginScreen onLogin={login} />
}
