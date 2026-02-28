import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import AuthGuard from '@/components/shared/AuthGuard'
import dayjs from 'dayjs'
import type { Order, OrderStatus } from '@/types'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_app/orders/')({
  component: () => (
    <AuthGuard>
      <OrderHistoryPage />
    </AuthGuard>
  ),
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
})

function OrderHistoryPage() {
  const navigate = useNavigate()
  const { page } = useSearch({ from: '/_app/orders/' })
  const { data: ordersResp, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.history(page).then((r) => r.data),
  })
  const orders = ordersResp?.data
  const meta = ordersResp?.meta

  return (
    <div className="page-container section-gap">
      <h2 className="text-2xl font-bold mb-6">My Orders</h2>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : !orders?.length ? (
          <div className="p-12 text-center text-slate-400">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-semibold">Order ID</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order: Order) => (
                  <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to="/orders/$id" params={{ id: order.id }} search={{ success: undefined }}
                        className="font-semibold text-indigo-600 hover:underline">
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{dayjs(order.created_at).format('MMM D, YYYY h:mm A')}</td>
                    <td className="px-4 py-4"><OrderStatusBadge status={order.status as OrderStatus} /></td>
                    <td className="px-4 py-4 font-semibold">৳{order.total.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <Button variant="ghost" size="sm"
                        onClick={() => navigate({ to: '/orders/$id', params: { id: order.id }, search: { success: undefined } })}>
                        <Eye className="w-4 h-4 mr-1" />View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.total > meta.per_page && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1}
            onClick={() => navigate({ to: '/orders', search: { page: page - 1 } })}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-500">Page {page} of {Math.ceil(meta.total / meta.per_page)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(meta.total / meta.per_page)}
            onClick={() => navigate({ to: '/orders', search: { page: page + 1 } })}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
