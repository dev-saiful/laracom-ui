import { createFileRoute, Link } from '@tanstack/react-router'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import dayjs from 'dayjs'
import type { Order, OrderStatus } from '@/types'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/admin/_layout/orders/')({
  component: AdminOrdersPage,
})

function AdminOrdersPage() {
  const [status, setStatus] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin', 'orders', status, dateFrom, dateTo, page],
    queryFn: () => adminApi.orders.list({
      status: status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
    }).then((r) => r.data),
  })

  const meta = ordersData?.meta
  const totalPages = meta?.last_page ?? 1

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Orders</h1>
        <p className="text-sm text-slate-400 mt-0.5">View and manage customer orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            className="flex-1 sm:flex-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          />
          <span className="text-slate-400 text-sm shrink-0">to</span>
          <input
            type="date"
            className="flex-1 sm:flex-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          />
          {(dateFrom || dateTo) && (
            <button className="text-xs text-slate-400 hover:text-slate-600 underline shrink-0" onClick={() => { setDateFrom(''); setDateTo('') }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 hidden sm:table-cell">Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(ordersData?.data ?? []).map((order: Order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to="/admin/orders/$id" params={{ id: order.id }} className="font-semibold text-indigo-600 hover:underline">
                        #{order.order_number}
                      </Link>
                      <p className="text-xs text-slate-400">{dayjs(order.created_at).format('MMM D, YYYY')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{order.shipping_address?.name || 'N/A'}</p>
                      <p className="text-xs text-slate-400">{order.guest_email || order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status as OrderStatus} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 hidden sm:table-cell">৳{order.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-500 hidden md:table-cell">{order.items.length}</td>
                    <td className="px-4 py-3 text-center">
                      <Link to="/admin/orders/$id" params={{ id: order.id }}>
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Eye className="h-4 w-4" /></button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {(ordersData?.data ?? []).length === 0 && (
                  <tr><td colSpan={6} className="py-16 text-center text-slate-400">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>Page {page} of {totalPages} &middot; {meta?.total} orders</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
