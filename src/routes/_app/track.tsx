import { createFileRoute } from '@tanstack/react-router'
import { Search, CheckCircle2, Copy, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { getErrorMessage } from '@/lib/error'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/track')({
  component: TrackOrderPage,
  validateSearch: (search: Record<string, unknown>) => ({
    orderNumber: search.orderNumber as string | undefined,
    success: search.success as string | undefined,
  }),
})

const STEP_MAP: Record<string, number> = {
  pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4,
}
const STEPS = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered']

function TrackOrderPage() {
  const { orderNumber: urlOrderNumber, success } = Route.useSearch()
  const [orderNumber, setOrderNumber] = useState(urlOrderNumber || '')
  const [search, setSearch] = useState(urlOrderNumber || '')
  const [showSuccess, setShowSuccess] = useState(success === 'true')

  useEffect(() => {
    if (urlOrderNumber && !search) setSearch(urlOrderNumber)
  }, [urlOrderNumber, search])

  const { data: trackResp, isLoading, isError, error } = useQuery({
    queryKey: ['track', search],
    queryFn: () => ordersApi.track(search).then((r) => r.data),
    enabled: !!search,
    retry: false,
  })
  const order = trackResp?.data

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number)
        .then(() => toast.success('Order number copied!'))
        .catch(() => toast.error('Could not copy'))
    }
  }

  const apiErrorMessage = isError ? getErrorMessage(error, 'Please check the order number and try again.') : ''
  const stepStatus = order ? (STEP_MAP[order.status] ?? -1) : 0

  return (
    <div className="page-container section-gap" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Success Banner */}
      {showSuccess && order && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 relative">
          <button onClick={() => setShowSuccess(false)} className="absolute top-4 right-4 text-green-400 hover:text-green-600">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-lg font-bold text-green-800">Order Placed Successfully!</span>
          </div>
          <p className="text-green-700 text-sm mb-4">Your order has been confirmed. Here is your order tracking number:</p>
          <div className="bg-white border-2 border-dashed border-indigo-400 rounded-xl p-4 flex justify-between items-center mb-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Order Number</span>
              <span className="text-xl font-extrabold text-indigo-600 tracking-wide">{order.order_number}</span>
            </div>
            <Button size="sm" onClick={copyOrderNumber}>
              <Copy className="w-3.5 h-3.5 mr-1" />Copy
            </Button>
          </div>
          <div className="space-y-1.5 text-sm">
            <p className="font-semibold text-orange-600">⚠️ Important: Save this order number!</p>
            <p className="text-slate-500">• Use this number to track your order anytime on this page</p>
            <p className="text-slate-500">• A confirmation email has been sent to your email address</p>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-2">Track Your Order</h2>
        <p className="text-slate-400">Enter your order number to see the current status</p>
        <div className="flex gap-2 max-w-sm mx-auto mt-8">
          <Input
            placeholder="Order Number (e.g. ORD-123456)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(orderNumber)}
            className="flex-1"
          />
          <Button onClick={() => setSearch(orderNumber)} disabled={isLoading}>
            <Search className="w-4 h-4 mr-1" />{isLoading ? '...' : 'Track'}
          </Button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          <span className="font-semibold">Order not found:</span> {apiErrorMessage}
        </div>
      )}

      {order && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Order Number</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">#{order.order_number}</span>
                <button onClick={copyOrderNumber} className="text-slate-400 hover:text-indigo-500 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            {order.tracking_number && (
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Tracking Number</p>
                <span className="text-lg font-bold">{order.tracking_number}</span>
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mb-6">
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
                  <span className="text-[10px] mt-1 text-slate-500 hidden sm:block">{label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-1', idx < stepStatus ? 'bg-indigo-600' : 'bg-slate-100')} />
                )}
              </div>
            ))}
          </div>

          {order.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mt-4">
              Order has been cancelled
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Last updated: {new Date(order.updated_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
