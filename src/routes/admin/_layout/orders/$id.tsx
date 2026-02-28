import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Loader2, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { getErrorMessage } from '@/lib/error'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import { toast } from 'sonner'
import { useState } from 'react'
import dayjs from 'dayjs'
import type { OrderStatus, OrderItem } from '@/types'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/_layout/orders/$id')({
  component: AdminOrderDetailPage,
})

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
]

const STEP_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const
const STEP_MAP: Record<string, number> = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 }

interface StatusFormValues { status: string; tracking_number?: string }

function AdminOrderDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [statusModalOpen, setStatusModalOpen] = useState(false)

  const { register, handleSubmit, setValue, watch, reset } = useForm<StatusFormValues>()

  const { data: orderResp, isLoading } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => adminApi.orders.show(id).then((r) => r.data),
  })
  const order = orderResp?.data

  const updateStatus = useMutation({
    mutationFn: (values: StatusFormValues) => adminApi.orders.updateStatus(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      toast.success('Order status updated')
      setStatusModalOpen(false)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update status')),
  })

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
  if (!order) return <div className="p-10 text-slate-400 text-center">Order not found</div>

  const currentStep = STEP_MAP[order.status] ?? -1
  const selectedStatus = watch('status')

  const openModal = () => {
    reset({ status: order.status, tracking_number: order.tracking_number ?? '' })
    setStatusModalOpen(true)
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <Link to="/admin/orders">
          <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Back to Orders</Button>
        </Link>
        <h1 className="text-xl font-extrabold text-slate-900">Order #{order.order_number}</h1>
        <OrderStatusBadge status={order.status as OrderStatus} />
        <Button size="sm" className="gap-1.5 ml-auto" onClick={openModal}>
          <Pencil className="h-4 w-4" />Update Status
        </Button>
      </div>

      {/* Progress Steps */}
      {currentStep >= 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between">
            {STEP_STATUSES.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center shrink-0">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    i < currentStep ? 'bg-green-500 text-white' : i === currentStep ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-100 text-slate-400')}>
                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn('text-xs mt-1.5 font-medium capitalize', i <= currentStep ? 'text-slate-700' : 'text-slate-400')}>{step}</span>
                </div>
                {i < STEP_STATUSES.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2 -mt-3.5', i < currentStep ? 'bg-green-400' : 'bg-slate-200')} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Order Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Product</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-slate-600 w-16">Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-600 hidden sm:table-cell w-24">Unit</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-600 w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item: OrderItem) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.product_name}</p>
                      {item.variant_name && <p className="text-xs text-slate-400">{item.variant_name}</p>}
                      {item.sku && <p className="text-xs text-slate-300">SKU: {item.sku}</p>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-600 hidden sm:table-cell">৳{Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">৳{Number(item.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-sm text-slate-500">Subtotal</td>
                  <td className="px-4 py-2 text-right font-semibold">৳{Number(order.subtotal).toFixed(2)}</td>
                </tr>
                {order.shipping_cost > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-1.5 text-right text-sm text-slate-500">Shipping</td>
                    <td className="px-4 py-1.5 text-right text-slate-600">৳{Number(order.shipping_cost).toFixed(2)}</td>
                  </tr>
                )}
                {order.discount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-1.5 text-right text-sm text-green-600">Discount</td>
                    <td className="px-4 py-1.5 text-right text-green-600">-৳{Number(order.discount).toFixed(2)}</td>
                  </tr>
                )}
                <tr className="border-t border-slate-200">
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-800">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-orange-500">৳{Number(order.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-3">Order Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Date</span>
                <span className="font-medium">{dayjs(order.created_at).format('MMM D, YYYY h:mm A')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method</span>
                <span className="font-medium">{order.payment_method || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Status</span>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                  {order.payment_status?.toUpperCase()}
                </span>
              </div>
              {order.tracking_number && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Tracking No.</span>
                  <span className="font-mono text-xs font-medium">{order.tracking_number}</span>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-slate-400 mb-1">Notes</p>
                  <p className="text-slate-600 text-xs bg-slate-50 rounded-lg p-2">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-3">Shipping Address</h3>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold text-slate-800">{order.shipping_address.name}</p>
              <p className="text-slate-500">{order.shipping_address.address}</p>
              <p className="text-slate-500">{order.shipping_address.city}, {order.shipping_address.country}</p>
              <p className="text-slate-500">{order.shipping_address.phone}</p>
              {order.guest_email && (
                <>
                  <hr className="border-slate-100 my-2" />
                  <p className="text-slate-400">Guest: {order.guest_email}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update Order Status</DialogTitle></DialogHeader>
          <form id="status-form" onSubmit={handleSubmit((v) => updateStatus.mutate(v))} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={(v) => setValue('status', v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input id="tracking" placeholder="e.g. 1Z999AA10123456784" {...register('tracking_number')} />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="status-form" disabled={updateStatus.isPending} className="gap-1.5">
              {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
