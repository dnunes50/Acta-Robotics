'use client'
import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setAuthed(localStorage.getItem('cf-auth') === '1')
  }, [])

  if (authed === null) return null // hydration
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />
  return <Dashboard />
}
