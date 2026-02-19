import { createFileRoute, Link } from '@tanstack/react-router'
import { Table, Space, Select, DatePicker, Typography, Button, Row, Col, Card } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import dayjs from 'dayjs'
import type { Order, OrderStatus } from '@/types'
import { useState } from 'react'

import type { Dayjs } from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export const Route = createFileRoute('/admin/_layout/orders/')({
  component: AdminOrdersPage,
})

function AdminOrdersPage() {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [page, setPage] = useState(1)

  const dateFrom = dateRange?.[0]?.format('YYYY-MM-DD')
  const dateTo = dateRange?.[1]?.format('YYYY-MM-DD')

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin', 'orders', status, dateFrom, dateTo, page],
    queryFn: () => adminApi.orders.list({ status, date_from: dateFrom, date_to: dateTo, page }).then((r) => r.data),
  })

  const columns = [
    {
      title: 'Order',
      dataIndex: 'order_number',
      key: 'id',
      render: (text: string, record: Order) => (
        <div>
          <Link to="/admin/orders/$id" params={{ id: record.id }} style={{ fontWeight: 600 }}>#{text}</Link>
          <div style={{ fontSize: 12, color: '#64748b' }}>{dayjs(record.created_at).format('MMM D, YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, record: Order) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.shipping_address?.name || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{record.guest_email || record.user?.email}</div>
        </div>
      ),
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
      responsive: ['sm'],
      render: (val: number) => <Text strong>${val.toFixed(2)}</Text>,
    },
    {
      title: 'Items',
      key: 'items',
      responsive: ['md'],
      render: (_: unknown, record: Order) => record.items.length,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: Order) => (
        <Link to="/admin/orders/$id" params={{ id: record.id }}>
          <Button type="text" icon={<EyeOutlined />} />
        </Link>
      ),
    },
  ]

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Orders</Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="Filter Status"
            allowClear
            style={{ width: '100%' }}
            onChange={setStatus}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Processing', value: 'processing' },
              { label: 'Shipped', value: 'shipped' },
              { label: 'Delivered', value: 'delivered' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <RangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range as [Dayjs | null, Dayjs | null] | null)
              setPage(1)
            }}
            allowClear
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          dataSource={ordersData?.data || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
              total: ordersData?.meta?.total,
              pageSize: ordersData?.meta?.per_page,
              current: page,
              showSizeChanger: false,
              onChange: (p) => setPage(p),
          }}
        />
      </Card>
    </div>
  )
}
