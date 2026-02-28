import { useState, useEffect } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  ShoppingCart, User, Menu, LogOut, ListOrdered,
  LayoutDashboard, LogIn, Settings, Home, Grid3x3,
  MapPin, X, Phone, Tag, Heart, Search,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useQuery } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { wishlistApi } from '@/api/wishlist'
import { authApi } from '@/api/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'

const NAV_LINKS = [
  { to: '/',         label: 'Home',         icon: <Home className="h-4 w-4" />,       exact: true },
  { to: '/products', label: 'All Products', icon: <Grid3x3 className="h-4 w-4" /> },
  { to: '/track',    label: 'Track Order',  icon: <MapPin className="h-4 w-4" /> },
]

export default function Navbar() {
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const { data: wishlistCount } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistApi.count().then((r) => r.data.data.count),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: isAuthenticated,
  })

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignored */ }
    clearAuth()
    toast.success('Logged out successfully')
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

  return (
    <header className={`app-navbar${scrolled ? ' scrolled' : ''}`}>

      {/* Announcement Bar */}
      <div className="navbar-announcement">
        <div className="page-container">
          <div className="navbar-announcement-inner">
            <span className="navbar-announcement-item">
              🚚 <strong>Free shipping</strong> on orders over $50
            </span>
            <span className="navbar-announcement-divider" />
            <span className="navbar-announcement-item">
              <Tag className="inline h-3 w-3 mr-1" /> Use code <strong>SAVE10</strong> for 10% off
            </span>
            <span className="navbar-announcement-divider" />
            <span className="navbar-announcement-item">
              <Phone className="inline h-3 w-3 mr-1" /> Support: <strong>Mon–Fri 9am–6pm</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="navbar-main">
        <div className="page-container navbar-main-inner">

          {/* Logo */}
          <Link to="/" className="no-underline shrink-0 flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-indigo-200"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              ✨
            </span>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Lara<span className="text-indigo-500">com</span>
            </span>
          </Link>

          {/* Search (desktop) */}
          <div className="navbar-search-wrap desktop-only">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                aria-label="Search products"
                placeholder="Search for products, brands and more…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchValue)}
                className="navbar-search-input pl-9 pr-10"
              />
              {searchValue && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setSearchValue('')}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="navbar-actions">

            {/* Wishlist */}
            <button
              className="navbar-icon-btn desktop-only"
              aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}
              onClick={() => isAuthenticated ? navigate({ to: '/wishlist' }) : navigate({ to: '/auth/login' })}
            >
              <span className="relative inline-flex">
                <Heart className="h-5 w-5" />
                {isAuthenticated && (wishlistCount ?? 0) > 0 && (
                  <span className="navbar-cart-badge">{wishlistCount! > 99 ? '99+' : wishlistCount}</span>
                )}
              </span>
              <span className="navbar-icon-label">Wishlist</span>
            </button>

            {/* Cart */}
            <button
              className="navbar-icon-btn"
              aria-label={`Shopping cart${cartCount ? `, ${cartCount} items` : ''}`}
              onClick={() => navigate({ to: '/cart' })}
            >
              <span className="relative inline-flex">
                <ShoppingCart className="h-5.5 w-5.5" style={{ width: 22, height: 22 }} />
                {(cartCount ?? 0) > 0 && (
                  <span className="navbar-cart-badge">{cartCount! > 99 ? '99+' : cartCount}</span>
                )}
              </span>
              <span className="navbar-icon-label">Cart</span>
            </button>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="navbar-icon-btn" aria-label="Account menu">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: isAuthenticated ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#cbd5e1' }}>
                    {isAuthenticated ? user?.name?.[0]?.toUpperCase() : <User className="h-3.5 w-3.5 text-slate-500" />}
                  </div>
                  <span className="navbar-icon-label">
                    {isAuthenticated ? user?.name?.split(' ')[0] : 'Account'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {isAuthenticated ? (
                  <>
                    <DropdownMenuLabel>
                      <p className="font-semibold text-sm text-slate-800">{user?.name}</p>
                      <p className="text-xs text-slate-400 font-normal">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" search={{ page: 1 }} className="flex items-center gap-2 cursor-pointer">
                        <ListOrdered className="h-4 w-4" />My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 gap-2 cursor-pointer" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/auth/login" className="flex items-center gap-2 cursor-pointer">
                        <LogIn className="h-4 w-4" />Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/auth/register" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />Create Account
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="mobile-menu-btn navbar-icon-btn" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="px-5 py-4 border-b border-slate-100">
                  <SheetTitle className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>🛍️</span>
                    <span className="font-black text-slate-900">Lara<span className="text-orange-500">com</span></span>
                  </SheetTitle>
                </SheetHeader>

                <div className="px-5 py-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      placeholder="Search products…"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch((e.target as HTMLInputElement).value)}
                    />
                  </div>

                  {/* User greeting */}
                  {isAuthenticated && (
                    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.email}</p>
                      </div>
                    </div>
                  )}

                  <hr className="border-slate-100" />

                  {/* Nav Links */}
                  <nav className="space-y-1">
                    {NAV_LINKS.map((link) => {
                      const active = isLinkActive(link.to, link.exact)
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${active ? 'bg-orange-50 text-orange-500' : 'text-slate-600 hover:bg-slate-50'}`}
                          style={{ textDecoration: 'none' }}
                          aria-current={active ? 'page' : undefined}
                        >
                          <span className={active ? 'text-orange-400' : 'text-slate-400'}>{link.icon}</span>
                          {link.label}
                        </Link>
                      )
                    })}
                  </nav>

                  <hr className="border-slate-100" />

                  {/* Auth Actions */}
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                          <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                            <LayoutDashboard className="h-4 w-4" />Admin Dashboard
                          </Button>
                        </Link>
                      )}
                      <Link to="/orders" search={{ page: 1 }} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                        <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                          <ListOrdered className="h-4 w-4" />My Orders
                        </Button>
                      </Link>
                      <Link to="/account" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                        <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                          <Settings className="h-4 w-4" />Account Settings
                        </Button>
                      </Link>
                      <Button variant="destructive" className="w-full gap-2 text-sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <Link to="/auth/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                        <Button className="w-full gap-2"><LogIn className="h-4 w-4" />Sign In</Button>
                      </Link>
                      <Link to="/auth/register" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                        <Button variant="outline" className="w-full gap-2"><User className="h-4 w-4" />Create Account</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Category Nav Bar */}
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
            <Link to="/products" className="cat-nav-link cat-nav-deal">🔥 Hot Deals</Link>
            <Link to="/products" className="cat-nav-link">New Arrivals</Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
