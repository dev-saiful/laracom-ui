import { createFileRoute, Link } from '@tanstack/react-router'
import { Typography, Row, Col, Card, Steps, Button, Popconfirm, Space, Alert } from 'antd'
import { ArrowLeftOutlined, UndoOutlined, CheckCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { getErrorMessage } from '@/lib/error'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import AuthGuard from '@/components/shared/AuthGuard'
import dayjs from 'dayjs'
import { App } from 'antd'
import { useState } from 'react'

const { Title, Text, Paragraph } = Typography

export const Route = createFileRoute('/_app/orders/$id')({
  component: () => (
    <AuthGuard>
      <OrderDetailPage />
    </AuthGuard>
  ),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      success: search.success as string | undefined,
    }
  },
})

function OrderDetailPage() {
  const { id } = Route.useParams()
  const { success } = Route.useSearch()
  const { message } = App.useApp()
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
      message.success('Order number copied to clipboard!')
    }
  }

  const cancelOrder = useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      message.success('Order cancelled successfully')
    },
    onError: (err: unknown) => message.error(getErrorMessage(err, 'Failed to cancel order')),
  })

  if (isLoading) return <div className="page-container section-gap">Loading...</div>
  if (!order) return <div className="page-container section-gap">Order not found</div>

  const stepStatus = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1,
    refunded: -1,
  }[order.status]

  return (
    <div className="page-container section-gap">
      {/* Order Success Alert */}
      {showSuccess && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
              <Text strong style={{ fontSize: 16 }}>Order Placed Successfully!</Text>
            </div>
          }
          description={
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 16 }}>
                <Text>Your order has been confirmed. Here is your order tracking number:</Text>
              </div>
              <div
                style={{
                  background: '#f6f8fa',
                  padding: '16px 20px',
                  borderRadius: 8,
                  border: '2px dashed #6366f1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Order Number</Text>
                  <Text strong style={{ fontSize: 20, color: '#6366f1', letterSpacing: '0.5px' }}>
                    {order.order_number}
                  </Text>
                </div>
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={copyOrderNumber}
                  style={{ flexShrink: 0 }}
                >
                  Copy
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Text strong style={{ color: '#f97316' }}>⚠️ Important: Save this order number!</Text>
                <Text type="secondary">• Use this number to track your order on the <Link to="/track">Track Order</Link> page</Text>
                <Text type="secondary">• You'll need it for any inquiries about your order</Text>
                <Text type="secondary">• A confirmation email has been sent to your registered email address</Text>
              </div>
            </div>
          }
          type="success"
          closable
          onClose={() => setShowSuccess(false)}
          style={{ marginBottom: 32, borderRadius: 12 }}
          showIcon={false}
        />
      )}

      <Space style={{ marginBottom: 24 }}>
        <Link to="/orders">
          <Button icon={<ArrowLeftOutlined />}>Back to Orders</Button>
        </Link>
        <Title level={3} style={{ margin: 0 }}>Order #{order.order_number}</Title>
        <OrderStatusBadge status={order.status} />
      </Space>

      {/* Progress Steps */}
      {order.status !== 'cancelled' && order.status !== 'refunded' && (
        <Card style={{ marginBottom: 32, borderRadius: 12 }}>
          <Steps
            current={stepStatus}
            items={[
              { title: 'Placed', description: dayjs(order.created_at).format('MMM D, h:mm A') },
              { title: 'Confirmed' },
              { title: 'Processing' },
              { title: 'Shipped' },
              { title: 'Delivered' },
            ]}
          />
        </Card>
      )}

      {order.status === 'cancelled' && (
        <Alert message="This order has been cancelled" type="error" showIcon style={{ marginBottom: 32 }} />
      )}

      <Row gutter={32}>
        <Col xs={24} lg={16}>
          {/* Order Items */}
          <Card title="Items" bordered={false} style={{ marginBottom: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>{item.product_name}</Text>
                    {item.variant_name && <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>{item.variant_name}</Text>}
                    <Text type="secondary">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</Text>
                  </div>
                  <Text strong>${item.total_price.toFixed(2)}</Text>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                <Text strong>Total</Text>
                <Title level={4} style={{ margin: 0, color: '#6366f1' }}>${order.total.toFixed(2)}</Title>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Shipping Info */}
          <Card title="Shipping Details" bordered={false} style={{ marginBottom: 24, borderRadius: 12 }}>
            <Title level={5}>{order.shipping_address.name}</Title>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              {order.shipping_address.address}<br />
              {order.shipping_address.city}, {order.shipping_address.country}
            </Paragraph>
            <Text type="secondary">{order.shipping_address.phone}</Text>
          </Card>

          {/* Actions */}
          {order.can_cancel && (
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Popconfirm
                title="Cancel Order"
                description="Are you sure you want to cancel this order?"
                onConfirm={() => cancelOrder.mutate(order.id)}
                okText="Yes, Cancel"
                cancelText="No"
              >
                <Button danger block size="large" icon={<UndoOutlined />} loading={cancelOrder.isPending}>
                  Cancel Order
                </Button>
              </Popconfirm>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}
