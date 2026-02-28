import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ShoppingBag, Users, DollarSign, Package,
  TrendingUp, TrendingDown, Clock, CheckCircle2,
  RefreshCw, Truck, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/_layout/')({
  component: AdminDashboard,
})

interface StatCardProps {
  title: string
  value: number | string | undefined
  prefix?: string
  suffix?: string
  color: string
  bgColor: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  loading?: boolean
  precision?: number
}

function StatCard({ title, value, prefix, suffix, color, bgColor, icon, trend, trendLabel, loading, precision }: StatCardProps) {
  const numericValue = value !== undefined && value !== null ? Number(value) : 0
  const displayValue = precision ? numericValue.toFixed(precision) : numericValue.toLocaleString()

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border-t-[3px]" style={{ borderTopColor: color }}>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{title}</p>
            <p className="text-3xl font-extrabold text-slate-900 leading-none tracking-tight">
              {prefix}{displayValue}{suffix}
            </p>
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                {trend >= 0
                  ? <TrendingUp className="h-3 w-3 text-green-500" />
                  : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={cn('text-xs font-semibold', trend >= 0 ? 'text-green-500' : 'text-red-500')}>
                  {Math.abs(trend)}%
                </span>
                {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: bgColor, color }}>
            {icon}
          </div>
        </div>
      )}
    </div>
  )
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
    </div>
  )
}

function AdminDashboard() {
  const { data: orderStats, isLoading: orderLoading } = useQuery({
    queryKey: ['admin', 'orders', 'stats'],
    queryFn: () => adminApi.orders.statistics().then((r) => r.data.data),
  })

  const { data: userStats, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: () => adminApi.users.statistics().then((r) => r.data.data),
  })

  const { data: inventoryStats, isLoading: invLoading } = useQuery({
    queryKey: ['admin', 'inventory', 'stats'],
    queryFn: () => adminApi.inventory.statistics().then((r) => r.data.data),
  })

  const loading = orderLoading || userLoading || invLoading

  const activeOrders = (orderStats?.confirmed ?? 0) + (orderStats?.processing ?? 0) + (orderStats?.shipped ?? 0)
  const totalOrders = orderStats?.total_orders || 1
  const deliveredPct = Math.round(((orderStats?.delivered ?? 0) / totalOrders) * 100)
  const cancelledPct = Math.round(((orderStats?.cancelled ?? 0) / totalOrders) * 100)

  const ORDER_STATUSES = [
    { label: 'Pending',    count: orderStats?.pending,    icon: <Clock className="h-5 w-5" />,         color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Confirmed',  count: orderStats?.confirmed,  icon: <CheckCircle2 className="h-5 w-5" />,  color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Processing', count: orderStats?.processing, icon: <RefreshCw className="h-5 w-5" />,     color: '#8b5cf6', bg: '#ede9fe' },
    { label: 'Shipped',    count: orderStats?.shipped,    icon: <Truck className="h-5 w-5" />,         color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Delivered',  count: orderStats?.delivered,  icon: <CheckCircle2 className="h-5 w-5" />,  color: '#22c55e', bg: '#dcfce7' },
    { label: 'Cancelled',  count: orderStats?.cancelled,  icon: <AlertTriangle className="h-5 w-5" />, color: '#ef4444', bg: '#fee2e2' },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-7 flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/products">
            <Button variant="outline" size="sm" className="gap-1.5"><ShoppingBag className="h-4 w-4" />View Products</Button>
          </Link>
          <Link to="/admin/orders">
            <Button size="sm" className="gap-1.5">All Orders<ChevronRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value={orderStats?.total_revenue} prefix="৳" precision={2}
          color="#22c55e" bgColor="#dcfce7" icon={<DollarSign className="h-5 w-5" />} loading={loading} />
        <StatCard title="Total Orders" value={orderStats?.total_orders}
          color="#f97316" bgColor="#ffedd5" icon={<ShoppingBag className="h-5 w-5" />} loading={loading} />
        <StatCard title="Active Users" value={userStats?.active_users}
          color="#0ea5e9" bgColor="#e0f2fe" icon={<Users className="h-5 w-5" />} loading={loading} />
        <StatCard title="Low Stock Items" value={inventoryStats?.low_stock}
          color={(inventoryStats?.low_stock ?? 0) > 0 ? '#ef4444' : '#22c55e'}
          bgColor={(inventoryStats?.low_stock ?? 0) > 0 ? '#fee2e2' : '#dcfce7'}
          icon={<Package className="h-5 w-5" />} loading={loading} />
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Today's Performance */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800">Today's Performance</h3>
            <span className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full">Live</span>
          </div>
          {loading ? <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div> : (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Today's Revenue</span><span className="font-semibold text-green-600">৳{Number(orderStats?.today_revenue ?? 0).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">New Orders Today</span><span className="font-semibold text-orange-500">{orderStats?.today_orders ?? 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">New Users Today</span><span className="font-semibold text-sky-500">{userStats?.new_today ?? 0}</span></div>
              </div>
              <hr className="border-slate-100" />
              <div>
                <p className="text-sm text-slate-500 mb-2">Order Completion Rate</p>
                <ProgressBar percent={deliveredPct} color="linear-gradient(90deg, #f97316, #22c55e)" />
                <p className="text-xs text-slate-400 mt-1">{orderStats?.delivered ?? 0} of {totalOrders} orders delivered — <strong className="text-slate-600">{deliveredPct}%</strong></p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Cancellation Rate</p>
                <ProgressBar percent={cancelledPct} color="#ef4444" />
                <p className="text-xs mt-1 font-semibold text-red-400">{cancelledPct}%</p>
              </div>
            </div>
          )}
        </div>

        {/* User Overview */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800">User Overview</h3>
            <Link to="/admin/users"><button className="text-xs text-indigo-600 font-medium hover:underline">View All</button></Link>
          </div>
          {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div> : (
            <div className="space-y-3">
              {[
                { label: 'Total Users',    value: userStats?.total_users,    color: '#f97316', icon: '👥' },
                { label: 'Customers',      value: userStats?.total_customers, color: '#0ea5e9', icon: '🛒' },
                { label: 'Admins',         value: userStats?.total_admins,    color: '#8b5cf6', icon: '🔧' },
                { label: 'New This Month', value: userStats?.new_this_month,  color: '#22c55e', icon: '✨' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                  <span className="font-bold text-base" style={{ color }}>{value ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Health */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800">Inventory Health</h3>
            <Link to="/admin/inventory"><button className="text-xs text-indigo-600 font-medium hover:underline">Manage</button></Link>
          </div>
          {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div> : (
            <div className="space-y-3">
              <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-500">Total Products</span>
                  <span className="font-bold text-lg text-orange-500">{inventoryStats?.total_products ?? 0}</span>
                </div>
                <p className="text-xs text-slate-400">{inventoryStats?.active_products ?? 0} active</p>
              </div>
              {[
                { label: 'Out of Stock',  value: inventoryStats?.out_of_stock,           color: '#ef4444', bg: '#fee2e2', warn: true },
                { label: 'Low Stock',     value: inventoryStats?.low_stock,              color: '#f59e0b', bg: '#fef3c7', warn: true },
                { label: 'Variants OOS',  value: inventoryStats?.variants_out_of_stock,  color: '#8b5cf6', bg: '#ede9fe', warn: false },
              ].map(({ label, value, color, bg, warn }) => (
                <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: (value ?? 0) > 0 && warn ? bg : '#f8fafc' }}>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    {warn && (value ?? 0) > 0 && <AlertTriangle className="h-3.5 w-3.5" style={{ color }} />}
                    {label}
                  </div>
                  <span className="font-bold text-sm" style={{ color: (value ?? 0) > 0 ? color : '#22c55e' }}>{value ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-800">Order Status Breakdown</h3>
          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-700 font-semibold">{activeOrders} Active</span>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {ORDER_STATUSES.map(({ label, count, icon, color, bg }) => (
              <div key={label} className="flex flex-col items-center text-center py-4 px-2 rounded-xl border transition-transform hover:-translate-y-0.5 cursor-default"
                style={{ background: bg, borderColor: `${color}22` }}>
                <span style={{ color }} className="mb-1.5">{icon}</span>
                <span className="text-2xl font-extrabold text-slate-900 leading-none">{count ?? 0}</span>
                <span className="text-xs text-slate-500 mt-1">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
