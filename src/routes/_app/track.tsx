import { createFileRoute } from '@tanstack/react-router'
import { Typography, Input, Steps, Card, Alert, Button, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { getErrorMessage } from '@/lib/error'
import { useState } from 'react'

const { Title, Text } = Typography

export const Route = createFileRoute('/_app/track')({
  component: TrackOrderPage,
})

function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [search, setSearch] = useState('')

  const { data: trackResp, isLoading, isError, error } = useQuery({
    queryKey: ['track', search],
    queryFn: () => ordersApi.track(search).then((r) => r.data),
    enabled: !!search,
    retry: false,
  })
  const order = trackResp?.data

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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Order Number</Text>
              <Text strong style={{ fontSize: 18 }}>#{order.order_number}</Text>
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
