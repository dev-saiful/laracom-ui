import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Typography, Table, Button, InputNumber, Row, Col, Card, Space, Empty, Popconfirm } from 'antd'
import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { App } from 'antd'
import type { CartItem } from '@/types'

const { Title, Text } = Typography

export const Route = createFileRoute('/_app/cart')({
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const { data: cartResp, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data),
  })
  const cart = cartResp?.data

  const updateItem = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => cartApi.updateItem(id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
    },
    onError: () => message.error('Failed to update cart'),
  })

  const removeItem = useMutation({
    mutationFn: (id: string) => cartApi.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      message.success('Item removed')
    },
  })

  const clearCart = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      message.success('Cart cleared')
    },
  })

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      render: (_: unknown, item: CartItem) => (
        <Space>
          <img 
            src={item.product.images?.[0] || 'https://placehold.co/100x100'} 
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} 
          />
          <div>
            <Link to="/products/$slug" params={{ slug: item.product.slug }} style={{ display: 'block', fontWeight: 500 }}>
              {item.product.name}
            </Link>
            {item.variant && <Text type="secondary" style={{ fontSize: 12 }}>{item.variant.name}</Text>}
          </div>
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'unit_price',
      key: 'price',
      render: (val: number) => `$${val.toFixed(2)}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number, item: CartItem) => (
        <InputNumber
          min={1}
          value={val}
          onChange={(v) => v && updateItem.mutate({ id: item.id, qty: v })}
          disabled={updateItem.isPending}
        />
      ),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (val: number) => <Text strong>${val.toFixed(2)}</Text>,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, item: CartItem) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => removeItem.mutate(item.id)} 
          loading={removeItem.isPending}
        />
      ),
    },
  ]

  if (isLoading) return <div className="page-container section-gap">Loading...</div>

  if (!cart || cart.items.length === 0) {
    return (
      <div className="page-container section-gap" style={{ textAlign: 'center', padding: '80px 0' }}>
        <Empty description="Your cart is empty" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        <Link to="/products">
          <Button type="primary" size="large" icon={<ShoppingOutlined />} style={{ marginTop: 24 }}>
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="page-container section-gap">
      <Title level={2} style={{ marginBottom: 24 }}>Shopping Cart</Title>

      <Row gutter={32}>
        <Col xs={24} lg={16}>
          <Table
            dataSource={cart.items}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 600 }}
            style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Popconfirm title="Are you sure?" onConfirm={() => clearCart.mutate()}>
              <Button danger type="text">Clear Cart</Button>
            </Popconfirm>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Order Summary" bordered={false} style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Subtotal</Text>
                <Text strong>${cart.total.toFixed(2)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Shipping</Text>
                <Text type="secondary">Calculated at checkout</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Total</Title>
                <Title level={4} style={{ margin: 0, color: '#6366f1' }}>${cart.total.toFixed(2)}</Title>
              </div>
              <Button type="primary" size="large" block onClick={() => navigate({ to: '/checkout' })}>
                Proceed to Checkout
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
