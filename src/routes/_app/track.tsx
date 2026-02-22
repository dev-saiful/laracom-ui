import { createFileRoute } from '@tanstack/react-router'
import { Typography, Input, Steps, Card, Alert, Button, Space } from 'antd'
import { SearchOutlined, CheckCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { getErrorMessage } from '@/lib/error'
import { useState, useEffect } from 'react'
import { App } from 'antd'

const { Title, Text } = Typography

export const Route = createFileRoute('/_app/track')({
  component: TrackOrderPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      orderNumber: search.orderNumber as string | undefined,
      success: search.success as string | undefined,
    }
  },
})

function TrackOrderPage() {
  const { orderNumber: urlOrderNumber, success } = Route.useSearch()
  const { message } = App.useApp()
  const [orderNumber, setOrderNumber] = useState(urlOrderNumber || '')
  const [search, setSearch] = useState(urlOrderNumber || '')
  const [showSuccess, setShowSuccess] = useState(success === 'true')

  // Auto-trigger search if orderNumber is provided in URL
  useEffect(() => {
    if (urlOrderNumber && !search) {
      setSearch(urlOrderNumber)
    }
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
      message.success('Order number copied to clipboard!')
    }
  }

  const apiErrorMessage = isError ? getErrorMessage(error, 'Please check the order number and try again.') : ''

  const stepStatus = order ? {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1,
    refunded: -1,
  }[order.status] : 0

  return (
    <div className="page-container section-gap" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Order Success Alert for Guest Checkout */}
      {showSuccess && order && (
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
                <Text type="secondary">• Use this number to track your order anytime on this page</Text>
                <Text type="secondary">• You'll need it for any inquiries about your order</Text>
                <Text type="secondary">• A confirmation email has been sent to your email address</Text>
                <Text type="secondary">• Bookmark this page or save the order number somewhere safe</Text>
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

      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={2}>Track Your Order</Title>
        <Text type="secondary">Enter your order number to see the current status</Text>
        
        <div style={{ maxWidth: 400, margin: '32px auto 0' }}>
          <Space.Compact style={{ width: '100%' }} size="large">
            <Input 
              placeholder="Order Number (e.g. ORD-123456)" 
              value={orderNumber} 
              onChange={(e) => setOrderNumber(e.target.value)} 
            />
            <Button type="primary" onClick={() => setSearch(orderNumber)} loading={isLoading} icon={<SearchOutlined />}>
              Track
            </Button>
          </Space.Compact>
        </div>
      </div>

      {isError && (
        <Alert
          message="Order not found"
          description={apiErrorMessage}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {order && (
        <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Order Number</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong style={{ fontSize: 18 }}>#{order.order_number}</Text>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={copyOrderNumber}
                  style={{ flexShrink: 0 }}
                />
              </div>
            </div>
            {order.tracking_number && (
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Tracking Number</Text>
                <Text strong style={{ fontSize: 18 }}>{order.tracking_number}</Text>
              </div>
            )}
          </div>

          <Steps
            current={stepStatus}
            items={[
              { title: 'Placed' },
              { title: 'Confirmed' },
              { title: 'Processing' },
              { title: 'Shipped' },
              { title: 'Delivered' },
            ]}
          />
          
          {order.status === 'cancelled' && (
            <Alert message="Order has been cancelled" type="error" showIcon style={{ marginTop: 24 }} />
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Text type="secondary">Last updated: {new Date(order.updated_at).toLocaleString()}</Text>
          </div>
        </Card>
      )}
    </div>
  )
}
