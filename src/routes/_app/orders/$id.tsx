import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, RotateCcw, CheckCircle2, Copy, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { getErrorMessage } from '@/lib/error'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import AuthGuard from '@/components/shared/AuthGuard'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/orders/$id')({
  component: () => (
    <AuthGuard>
      <OrderDetailPage />
    </AuthGuard>
  ),
  validateSearch: (search: Record<string, unknown>) => ({
    success: search.success as string | undefined,
  }),
})

const STEPS = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered']
const STEP_MAP: Record<string, number> = {
  pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4,
}

function OrderDetailPage() {
  const { id } = Route.useParams()
  const { success } = Route.useSearch()
  const queryClient = useQueryClient()
  const [showSuccess, setShowSuccess] = useState(success === 'true')

  const { data: orderResp, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.show(id).then((r) => r.data),
  })
  const order = orderResp?.data

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number)
        .then(() => toast.success('Order number copied!'))
        .catch(() => toast.error('Could not copy'))
    }
  }

  const cancelOrder = useMutation({
    mutationFn: (orderId: string) => ordersApi.cancel(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      toast.success('Order cancelled successfully')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to cancel order')),
  })

  if (isLoading) return <div className="page-container section-gap">Loading...</div>
  if (!order) return <div className="page-container section-gap">Order not found</div>

  const stepStatus = STEP_MAP[order.status] ?? -1

  return (
    <div className="page-container section-gap">
      {/* Success Banner */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 relative">
          <button onClick={() => setShowSuccess(false)} className="absolute top-4 right-4 text-green-400 hover:text-green-600">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-lg font-bold text-green-800">Order Placed Successfully!</span>
          </div>
          <p className="text-green-700 text-sm mb-4">Your order has been confirmed.</p>
          <div className="bg-white border-2 border-dashed border-indigo-400 rounded-xl p-4 flex justify-between items-center mb-3">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Order Number</span>
              <span className="text-xl font-extrabold text-indigo-600">{order.order_number}</span>
            </div>
            <Button size="sm" onClick={copyOrderNumber}><Copy className="w-3.5 h-3.5 mr-1" />Copy</Button>
          </div>
          <div className="space-y-1 text-sm text-slate-500">
            <p className="font-semibold text-orange-600">⚠️ Important: Save this order number!</p>
            <p>• Use it to track your order on the <Link to="/track" search={{ orderNumber: undefined, success: undefined }} className="text-indigo-600 underline">Track Order</Link> page</p>
            <p>• A confirmation email has been sent to your registered email</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link to="/orders" search={{ page: 1 }}>
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <h3 className="text-xl font-bold">Order #{order.order_number}</h3>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Progress Steps */}
      {order.status !== 'cancelled' && order.status !== 'refunded' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
          <div className="flex items-center">
            {STEPS.map((label, idx) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                    idx < stepStatus ? 'bg-indigo-600 text-white'
                      : idx === stepStatus ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : 'bg-slate-100 text-slate-400'
                  )}>
                    {idx < stepStatus ? '✓' : idx + 1}
                  </div>
                  <span className="text-[10px] mt-1 hidden sm:block text-slate-500">{label}</span>
                  {idx === 0 && <span className="text-[9px] text-slate-400 hidden sm:block">{dayjs(order.created_at).format('MMM D')}</span>}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-1', idx < stepStatus ? 'bg-indigo-600' : 'bg-slate-100')} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-8">
          This order has been cancelled
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h4 className="font-bold text-base mb-4">Items</h4>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-sm">{item.product_name}</p>
                    {item.variant_name && <p className="text-xs text-slate-400">{item.variant_name}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity} × ৳{item.unit_price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold text-sm">৳{item.total_price.toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg text-indigo-600">৳{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h4 className="font-bold text-sm mb-3">Shipping Details</h4>
            <p className="font-semibold text-sm">{order.shipping_address.name}</p>
            <p className="text-sm text-slate-500 mt-1">
              {order.shipping_address.address}<br />
              {order.shipping_address.city}, {order.shipping_address.country}
            </p>
            <p className="text-sm text-slate-400 mt-1">{order.shipping_address.phone}</p>
          </div>

          {/* Cancel */}
          {order.can_cancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={cancelOrder.isPending}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to cancel this order? This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, Keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cancelOrder.mutate(order.id)}>Yes, Cancel</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  )
}
