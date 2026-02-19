import { useState } from 'react'
import {
  Layout, Button, Avatar, Typography, Space, Dropdown,
  Tooltip, Drawer, Grid,
} from 'antd'
import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  DashboardOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  TeamOutlined,
  InboxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
  ShopOutlined,
  TagsOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'
import { App } from 'antd'

const { Sider, Header, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const MENU_ITEMS = [
  {
    key: '/admin',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    to: '/admin',
    badge: null,
  },
  {
    key: '/admin/products',
    icon: <ShoppingOutlined />,
    label: 'Products',
    to: '/admin/products',
    badge: null,
  },
  {
    key: '/admin/categories',
    icon: <TagsOutlined />,
    label: 'Categories',
    to: '/admin/categories',
    badge: null,
  },
  {
    key: '/admin/orders',
    icon: <OrderedListOutlined />,
    label: 'Orders',
    to: '/admin/orders',
    badge: null,
  },
  {
    key: '/admin/users',
    icon: <TeamOutlined />,
    label: 'Users',
    to: '/admin/users',
    badge: null,
  },
  {
    key: '/admin/inventory',
    icon: <InboxOutlined />,
    label: 'Inventory',
    to: '/admin/inventory',
    badge: null,
  },
]

export default function AdminLayout() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const screens = useBreakpoint()
  const isMobile = !screens.md // md breakpoint is 768px

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignored */ }
    clearAuth()
    message.success('Logged out successfully')
    navigate({ to: '/auth/login' })
  }

  const activeKey = MENU_ITEMS
    .map((i) => i.key)
    .filter((k) => k === '/admin' ? currentPath === '/admin' : currentPath.startsWith(k))
    .sort((a, b) => b.length - a.length)[0] ?? '/admin'

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ display: 'block', fontSize: 13 }}>{user?.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{user?.email}</Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    { key: 'store', label: <Link to="/">View Store</Link>, icon: <ShopOutlined /> },
    { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
    { type: 'divider' as const },
    { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
  ]

  const renderSidebarContent = (isCollapsed: boolean) => (
    <>
      {/* Logo */}
      <div className="admin-logo">
        <div className="logo-icon">🛍️</div>
        {!isCollapsed && (
          <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            Lara<span style={{ color: '#f97316' }}>com</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#f97316',
              background: '#fff7ed', borderRadius: 4, padding: '1px 5px',
              marginLeft: 6, letterSpacing: '0.04em',
            }}>ADMIN</span>
          </span>
        )}
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {MENU_ITEMS.map(({ key, icon, label, to }) => {
          const isActive = key === activeKey
          return (
            <Tooltip
              key={key}
              title={isCollapsed ? label : ''}
              placement="right"
            >
              <Link
                to={to as '/admin'}
                aria-current={isActive ? 'page' : undefined}
                className={`admin-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => isMobile && setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCollapsed ? 0 : 10,
                  padding: isCollapsed ? '10px 0' : '10px 14px',
                  margin: '1px 8px',
                  borderRadius: 10,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  textDecoration: 'none',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  position: 'relative',
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span style={{
                    position: 'absolute', left: isCollapsed ? 0 : -8,
                    top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 20, background: '#f97316',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <span style={{
                  fontSize: 16,
                  color: isActive ? '#f97316' : '#64748b',
                  minWidth: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {icon}
                </span>
                {!isCollapsed && label}
              </Link>
            </Tooltip>
          )
        })}
      </div>

      {/* Bottom: View Store */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #f1f5f9' }}>
        <Tooltip title={isCollapsed ? 'View Store' : ''} placement="right">
          <Link
            to="/"
            className="admin-nav-link"
            onClick={() => isMobile && setMobileDrawerOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: isCollapsed ? '10px 0' : '10px 14px',
              margin: '0',
              borderRadius: 10,
              fontSize: 13.5, fontWeight: 500,
              textDecoration: 'none',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
          >
            <ShopOutlined style={{ fontSize: 16 }} />
            {!isCollapsed && 'View Store'}
          </Link>
        </Tooltip>
      </div>
    </>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={230}
          collapsedWidth={68}
          className="admin-sider"
          style={{
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            position: 'fixed',
            height: '100vh',
            left: 0, top: 0,
            zIndex: 200,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderSidebarContent(collapsed)}
        </Sider>
      )}

      {/* ── Mobile Drawer ── */}
      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0 } }}
        closeIcon={null}
      >
        <div style={{
          background: '#ffffff',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {renderSidebarContent(false)}
        </div>
      </Drawer>

      {/* ── Main Content Area ── */}
      <Layout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 68 : 230),
          transition: 'margin-left 0.2s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Top Header */}
        <Header style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 0 16px',
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 0 #e2e8f0',
        }}>
          {/* Left: Menu Toggle */}
          <Button
            type="text"
            aria-label={isMobile ? 'Open menu' : (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
            icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setMobileDrawerOpen(true) : setCollapsed(!collapsed)}
            style={{ fontSize: 16, height: 40, width: 40, borderRadius: 10, color: '#64748b' }}
          />

          {/* Right: User Menu */}
          <Space size={6}>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
              arrow={{ pointAtCenter: true }}
            >
              <Button
                type="text"
                aria-label="User menu"
                style={{ height: 40, borderRadius: 10, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Avatar
                  size={30}
                  icon={<UserOutlined />}
                  style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', fontSize: 13 }}
                />
                {!isMobile && (
                  <div style={{ textAlign: 'left' }}>
                    <Text strong style={{ display: 'block', fontSize: 13, lineHeight: 1.2 }}>
                      {user?.name?.split(' ')[0]}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: '#94a3b8', lineHeight: 1 }}>Administrator</Text>
                  </div>
                )}
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Page Content */}
        <Content style={{
          padding: isMobile ? 12 : 24,
          background: '#f8fafc',
          minHeight: 'calc(100vh - 64px)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
