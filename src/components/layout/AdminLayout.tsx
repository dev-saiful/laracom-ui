import { useState } from 'react'
import {
  LayoutDashboard, ShoppingBag, Tag, ClipboardList, Users,
  Package, Store, ChevronLeft, ChevronRight, Menu, LogOut,
  Settings,
} from 'lucide-react'
import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const MENU_ITEMS = [
  { key: '/admin',            icon: LayoutDashboard, label: 'Dashboard',  to: '/admin' },
  { key: '/admin/products',   icon: ShoppingBag,     label: 'Products',   to: '/admin/products' },
  { key: '/admin/categories', icon: Tag,             label: 'Categories', to: '/admin/categories' },
  { key: '/admin/orders',     icon: ClipboardList,   label: 'Orders',     to: '/admin/orders' },
  { key: '/admin/users',      icon: Users,           label: 'Users',      to: '/admin/users' },
  { key: '/admin/inventory',  icon: Package,         label: 'Inventory',  to: '/admin/inventory' },
]

function useActiveKey(currentPath: string) {
  return (
    MENU_ITEMS
      .map((i) => i.key)
      .filter((k) => k === '/admin' ? currentPath === '/admin' : currentPath.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] ?? '/admin'
  )
}

interface NavItemProps {
  item: (typeof MENU_ITEMS)[0]
  isActive: boolean
  collapsed: boolean
  onClick?: () => void
}

function NavItem({ item, isActive, collapsed, onClick }: NavItemProps) {
  const Icon = item.icon
  const link = (
    <Link
      to={item.to as '/admin'}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl text-sm font-medium no-underline transition-all duration-150',
        collapsed ? 'justify-center p-3 mx-1' : 'px-3 py-2.5 mx-2',
        isActive
          ? 'bg-indigo-600 text-white shadow shadow-indigo-500/20'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
      )}
    >
      <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
      {!collapsed && <span className="leading-none">{item.label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
      </Tooltip>
    )
  }
  return link
}

function SidebarContent({
  collapsed,
  activeKey,
  onItemClick,
}: {
  collapsed: boolean
  activeKey: string
  onItemClick?: () => void
}) {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Brand */}
      <div className={cn(
        'flex items-center gap-2.5 border-b border-slate-100 shrink-0 h-14',
        collapsed ? 'justify-center px-2' : 'px-4',
      )}>
        <span className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md shadow-indigo-500/30">
          🛍️
        </span>
        {!collapsed && (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="font-black text-[15px] tracking-tight text-slate-900 whitespace-nowrap">
              Lara<span className="text-indigo-600">com</span>
            </span>
            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider border border-indigo-100 shrink-0">
              Admin
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-5 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
            Navigation
          </p>
        )}
        {MENU_ITEMS.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isActive={item.key === activeKey}
            collapsed={collapsed}
            onClick={onItemClick}
          />
        ))}
      </nav>

      {/* Footer: View Store */}
      <div className="border-t border-slate-100 py-2 shrink-0">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                to="/"
                onClick={onItemClick}
                className="flex justify-center p-3 mx-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 no-underline transition-colors"
              >
                <Store className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">View Store</TooltipContent>
          </Tooltip>
        ) : (
          <Link
            to="/"
            onClick={onItemClick}
            className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 no-underline transition-colors"
          >
            <Store className="h-4 w-4 shrink-0" />
            <span>View Store</span>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const activeKey    = useActiveKey(currentPath)
  const currentLabel = MENU_ITEMS.find((i) => i.key === activeKey)?.label ?? 'Admin'

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignored */ }
    clearAuth()
    toast.success('Logged out successfully')
    navigate({ to: '/auth/login' })
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 flex">

        {/* ── Desktop Sidebar ── */}
        <aside className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 h-screen border-r border-slate-200 bg-white z-30',
          'transition-[width] duration-200 ease-in-out overflow-hidden',
          collapsed ? 'w-16' : 'w-60',
        )}>
          <SidebarContent collapsed={collapsed} activeKey={activeKey} />
        </aside>

        {/* ── Main Area (shifts with sidebar) ── */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0',
          'transition-[margin] duration-200 ease-in-out',
          collapsed ? 'md:ml-16' : 'md:ml-60',
        )}>
          {/* ── Top Header ── */}
          <header className="sticky top-0 z-20 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 gap-3 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile hamburger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-60 p-0 border-r" aria-label="Navigation menu">
                  <SidebarContent
                    collapsed={false}
                    activeKey={activeKey}
                    onItemClick={() => setMobileOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              {/* Desktop collapse toggle */}
              <Button
                variant="ghost" size="icon"
                className="hidden md:flex h-8 w-8 text-slate-400 hover:text-slate-700"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>

              {/* Separator */}
              <div className="hidden md:block w-px h-5 bg-slate-200 mx-1" />

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
                <span className="text-slate-400 hidden sm:inline">Admin</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:inline shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{currentLabel}</span>
              </nav>
            </div>

            {/* Right: user menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 rounded-xl hover:bg-slate-100 shrink-0">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-linear-to-br from-indigo-400 to-purple-600 text-white text-xs font-bold">
                      {user?.name?.[0]?.toUpperCase() ?? 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold leading-tight">{user?.name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">Administrator</p>
                  </div>
                  <ChevronRight className="hidden sm:block h-3 w-3 text-slate-300 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="pb-1">
                  <p className="font-semibold text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 font-normal truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer no-underline flex items-center gap-2">
                    <Store className="h-4 w-4" /> View Store
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer no-underline flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer gap-2"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* ── Page Content ── */}
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
