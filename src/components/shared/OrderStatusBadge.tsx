import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const statusConfig: Record<OrderStatus, { cls: string; label: string }> = {
  pending:    { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200',  label: 'Pending' },
  confirmed:  { cls: 'bg-blue-100 text-blue-800 border-blue-200',        label: 'Confirmed' },
  processing: { cls: 'bg-purple-100 text-purple-800 border-purple-200',  label: 'Processing' },
  shipped:    { cls: 'bg-cyan-100 text-cyan-800 border-cyan-200',         label: 'Shipped' },
  delivered:  { cls: 'bg-green-100 text-green-800 border-green-200',     label: 'Delivered' },
  cancelled:  { cls: 'bg-red-100 text-red-800 border-red-200',           label: 'Cancelled' },
  refunded:   { cls: 'bg-gray-100 text-gray-700 border-gray-200',        label: 'Refunded' },
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status] ?? { cls: 'bg-gray-100 text-gray-700 border-gray-200', label: status }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', cfg.cls)}>
      {cfg.label}
    </span>
  )
}
