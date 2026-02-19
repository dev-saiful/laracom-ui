import { Tag } from 'antd'
import type { OrderStatus } from '@/types'

const statusConfig: Record<OrderStatus, { color: string; label: string }> = {
  pending:    { color: 'gold',    label: 'Pending' },
  confirmed:  { color: 'blue',    label: 'Confirmed' },
  processing: { color: 'purple',  label: 'Processing' },
  shipped:    { color: 'cyan',    label: 'Shipped' },
  delivered:  { color: 'green',   label: 'Delivered' },
  cancelled:  { color: 'red',     label: 'Cancelled' },
  refunded:   { color: 'default', label: 'Refunded' },
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { color, label } = statusConfig[status] ?? { color: 'default', label: status }
  return <Tag color={color} style={{ fontWeight: 500 }}>{label}</Tag>
}
