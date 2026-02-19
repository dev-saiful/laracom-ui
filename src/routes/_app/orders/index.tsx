import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Typography, Table, Button, Pagination } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import AuthGuard from '@/components/shared/AuthGuard'
import dayjs from 'dayjs'
import type { Order, OrderStatus } from '@/types'

const { Title, Text } = Typography

export const Route = createFileRoute('/_app/orders/')({
  component: () => (
    <AuthGuard>
      <OrderHistoryPage />
    </AuthGuard>
  ),
})

function OrderHistoryPage() {
  const navigate = useNavigate()
  const { data: ordersResp, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.history().then((r) => r.data),
  })
  const orders = ordersResp?.data
  const meta = ordersResp?.meta

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'order_number',
      key: 'id',
      render: (text: string, record: Order) => (
        <Link to="/orders/$id" params={{ id: record.id }} style={{ fontWeight: 500 }}>
          #{text}
        </Link>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => <OrderStatusBadge status={status} />,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (val: number) => <Text strong>${val.toFixed(2)}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Order) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => navigate({ to: '/orders/$id', params: { id: record.id } })}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container section-gap">
      <Title level={2} style={{ marginBottom: 24 }}>My Orders</Title>
      
      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        pagination={false}
        loading={isLoading}
        style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}
      />
      
      {meta && meta.total > meta.per_page && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Pagination
            current={meta.current_page}
            total={meta.total}
            pageSize={meta.per_page}
            onChange={(page) => navigate({ search: { page } })}
          />
        </div>
      )}
    </div>
  )
}
