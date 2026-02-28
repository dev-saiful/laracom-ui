import { useEffect } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import Navbar from './Navbar'
import Footer from './Footer'

export default function AppLayout() {
  const { location } = useRouterState()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Navbar />
      <main className="flex-1 animate-in fade-in duration-200">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
