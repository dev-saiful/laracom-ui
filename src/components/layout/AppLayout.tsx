import { useEffect } from 'react'
import { Layout } from 'antd'
import { Outlet, useRouterState } from '@tanstack/react-router'
import Navbar from './Navbar'
import Footer from './Footer'

const { Content } = Layout

export default function AppLayout() {
  const { location } = useRouterState()

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <Content
        key={location.pathname}
        className="fade-in"
        style={{ flex: 1 }}
      >
        <Outlet />
      </Content>
      <Footer />
    </Layout>
  )
}
