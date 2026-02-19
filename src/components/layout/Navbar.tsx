import { useState, useEffect } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Badge, Button, Dropdown, Input, Space, Avatar, Drawer,
  Typography, Divider,
} from 'antd'
import {
  ShoppingCartOutlined,
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  DashboardOutlined,
  LoginOutlined,
  SettingOutlined,
  HomeOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  PhoneOutlined,
  TagOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { useQuery } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { authApi } from '@/api/auth'
import { App } from 'antd'

const { Text } = Typography

const NAV_LINKS = [
  { to: '/',         label: 'Home',        icon: <HomeOutlined />,        exact: true },
  { to: '/products', label: 'All Products', icon: <AppstoreOutlined /> },
  { to: '/track',    label: 'Track Order', icon: <EnvironmentOutlined /> },
]

export default function Navbar() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, clearAuth } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [scrolled, setScrolled] = useState(false)

  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { data: cartCount } = useQuery({
    queryKey: ['cart-count'],
    queryFn: () => cartApi.count().then((r) => r.data.data.count),
    refetchInterval: 30_000,
    enabled: true,
  })

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignored */ }
    clearAuth()
    message.success('Logged out successfully')
    navigate({ to: '/' })
    setMobileOpen(false)
  }

  const handleSearch = (value: string) => {
    const trimmed = value.trim()
    if (trimmed) {
      navigate({ to: '/products', search: { search: trimmed } })
      setMobileOpen(false)
    }
  }

  const isLinkActive = (to: string, exact = false) =>
    exact ? currentPath === to : currentPath.startsWith(to)

  const userMenuItems = isAuthenticated
    ? [
        {
          key: 'profile-info',
          label: (
            <div style={{ padding: '4px 0' }}>
              <Text strong style={{ display: 'block', fontSize: 14 }}>{user?.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>
            </div>
          ),
          disabled: true,
        },
        { type: 'divider' as const },
        ...(isAdmin
          ? [{ key: 'dashboard', label: <Link to="/admin">Admin Dashboard</Link>, icon: <DashboardOutlined /> }]
          : []),
        { key: 'account', label: <Link to="/account">My Account</Link>, icon: <SettingOutlined /> },
        { key: 'orders',  label: <Link to="/orders">My Orders</Link>,   icon: <OrderedListOutlined /> },
        { type: 'divider' as const },
        { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
      ]
    : [
        { key: 'login',    label: <Link to="/auth/login">Sign In</Link>,          icon: <LoginOutlined /> },
        { key: 'register', label: <Link to="/auth/register">Create Account</Link>, icon: <UserOutlined /> },
      ]

  return (
    <header className={`app-navbar${scrolled ? ' scrolled' : ''}`}>

      {/* ── Announcement Bar ── */}
      <div className="navbar-announcement">
        <div className="page-container">
          <div className="navbar-announcement-inner">
            <span className="navbar-announcement-item">
              🚚 <strong>Free shipping</strong> on orders over $50
            </span>
            <span className="navbar-announcement-divider" />
            <span className="navbar-announcement-item">
              <TagOutlined /> Use code <strong>SAVE10</strong> for 10% off
            </span>
            <span className="navbar-announcement-divider" />
            <span className="navbar-announcement-item">
              <PhoneOutlined /> Support: <strong>Mon–Fri 9am–6pm</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <div className="navbar-main">
        <div className="page-container navbar-main-inner">

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              borderRadius: 10,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, boxShadow: '0 4px 12px rgb(249 115 22 / 0.40)',
            }}>
              🛍️
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Lara<span style={{ color: '#f97316' }}>com</span>
            </span>
          </Link>

          {/* ── Search Bar (desktop) ── */}
          <div className="navbar-search-wrap desktop-only">
            <Input.Search
              aria-label="Search products"
              placeholder="Search for products, brands and more…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              allowClear
              size="large"
              className="navbar-search-input"
            />
          </div>

          {/* ── Right Action Icons ── */}
          <div className="navbar-actions">
            {/* Wishlist (visual placeholder) */}
            <button className="navbar-icon-btn desktop-only" aria-label="Wishlist">
              <HeartOutlined style={{ fontSize: 20 }} />
              <span className="navbar-icon-label">Wishlist</span>
            </button>

            {/* Cart */}
            <button
              className="navbar-icon-btn"
              aria-label={`Shopping cart${cartCount ? `, ${cartCount} items` : ''}`}
              onClick={() => navigate({ to: '/cart' })}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <ShoppingCartOutlined style={{ fontSize: 22 }} />
                {(cartCount ?? 0) > 0 && (
                  <span className="navbar-cart-badge">{cartCount! > 99 ? '99+' : cartCount}</span>
                )}
              </span>
              <span className="navbar-icon-label">Cart</span>
            </button>

            {/* Account */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
              arrow={{ pointAtCenter: true }}
            >
              <button className="navbar-icon-btn" aria-label="Account menu">
                <Avatar
                  size={24}
                  icon={<UserOutlined />}
                  style={{
                    background: isAuthenticated
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      : '#cbd5e1',
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                />
                <span className="navbar-icon-label">
                  {isAuthenticated ? user?.name?.split(' ')[0] : 'Account'}
                </span>
              </button>
            </Dropdown>

            {/* Mobile Hamburger */}
            <Button
              type="text"
              aria-label="Open navigation menu"
              icon={<MenuOutlined style={{ fontSize: 18 }} />}
              onClick={() => setMobileOpen(true)}
              className="mobile-menu-btn"
              style={{ height: 40, width: 40, borderRadius: 10 }}
            />
          </div>
        </div>
      </div>

      {/* ── Category Nav Bar ── */}
      <nav className="navbar-category-bar desktop-only" role="navigation" aria-label="Category navigation">
        <div className="page-container">
          <div className="navbar-category-inner">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.to, link.exact)
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`cat-nav-link${active ? ' active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="cat-nav-icon">{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
            <span className="cat-nav-divider" />
            <Link to="/products" className="cat-nav-link cat-nav-deal">
              🔥 Hot Deals
            </Link>
            <Link to="/products" className="cat-nav-link">
              New Arrivals
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 30, height: 30,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              borderRadius: 8,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>🛍️</span>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em' }}>
              Lara<span style={{ color: '#f97316' }}>com</span>
            </span>
          </div>
        }
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="right"
        width={300}
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: '16px 20px' } }}
        aria-label="Mobile navigation menu"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {/* Search */}
          <Input.Search
            placeholder="Search products…"
            onSearch={handleSearch}
            allowClear
            size="large"
          />

          {/* User greeting */}
          {isAuthenticated && (
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
              border: '1px solid #fed7aa',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Avatar
                size={40}
                icon={<UserOutlined />}
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
              />
              <div>
                <Text strong style={{ display: 'block', fontSize: 14 }}>{user?.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>
              </div>
            </div>
          )}

          <Divider style={{ margin: '0' }} />

          {/* Nav Links */}
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.to, link.exact)
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: active ? '#fff7ed' : 'transparent',
                  color: active ? '#f97316' : '#374151',
                  fontWeight: active ? 600 : 500,
                  fontSize: 15, textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                aria-current={active ? 'page' : undefined}
              >
                <span style={{ color: active ? '#f97316' : '#94a3b8', fontSize: 16 }}>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}

          <Divider style={{ margin: '0' }} />

          {/* Auth Actions */}
          {isAuthenticated ? (
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}>
                  <Button block icon={<DashboardOutlined />} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <Link to="/orders" onClick={() => setMobileOpen(false)}>
                <Button block icon={<OrderedListOutlined />} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  My Orders
                </Button>
              </Link>
              <Link to="/account" onClick={() => setMobileOpen(false)}>
                <Button block icon={<SettingOutlined />} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  Account Settings
                </Button>
              </Link>
              <Button danger block icon={<LogoutOutlined />} onClick={handleLogout}>
                Sign Out
              </Button>
            </Space>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button block type="primary" size="large" icon={<LoginOutlined />}>
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register" onClick={() => setMobileOpen(false)}>
                <Button block size="large" icon={<UserOutlined />}>
                  Create Account
                </Button>
              </Link>
            </Space>
          )}
        </Space>
      </Drawer>
    </header>
  )
}
