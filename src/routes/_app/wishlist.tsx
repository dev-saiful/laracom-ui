import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Typography, Button, Row, Col, Card, Empty, Popconfirm, Rate } from 'antd'
import { DeleteOutlined, ShoppingCartOutlined, HeartOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wishlistApi } from '@/api/wishlist'
import { cartApi } from '@/api/cart'
import { App } from 'antd'
import AuthGuard from '@/components/shared/AuthGuard'
import type { WishlistItem } from '@/types'

const { Title, Text } = Typography

export const Route = createFileRoute('/_app/wishlist')({
  component: () => (
    <AuthGuard>
      <WishlistPage />
    </AuthGuard>
  ),
})

function WishlistPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const { data: wishlistResp, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get().then((r) => r.data),
  })
  const wishlist = wishlistResp?.data || []

  const removeItem = useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] })
      message.success('Removed from wishlist')
    },
    onError: () => message.error('Failed to remove item'),
  })

  const clearWishlist = useMutation({
    mutationFn: wishlistApi.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] })
      message.success('Wishlist cleared')
    },
  })

  const addToCart = useMutation({
    mutationFn: (productId: string) => cartApi.addItem({ product_id: productId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      // Optionally remove from wishlist after adding to cart
      // removeItem.mutate(productId)
      message.success('Added to cart')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message ?? 'Failed to add to cart')
    },
  })

  if (isLoading) {
    return (
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <Card loading />
      </div>
    )
  }

  if (!wishlist.length) {
    return (
      <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80, minHeight: '60vh' }}>
        <Card>
          <Empty
            image={<HeartOutlined style={{ fontSize: 80, color: '#d1d5db' }} />}
            description={
              <div>
                <Title level={4} style={{ marginTop: 16 }}>Your Wishlist is Empty</Title>
                <Text type="secondary">Save your favorite items for later!</Text>
              </div>
            }
          >
            <Button type="primary" icon={<ShoppingOutlined />} onClick={() => navigate({ to: '/products' })}>
              Browse Products
            </Button>
          </Empty>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontSize: 28 }}>
              My Wishlist
            </Title>
            <Text type="secondary">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved</Text>
          </div>
          {wishlist.length > 0 && (
            <Popconfirm
              title="Clear wishlist?"
              description="This will remove all items from your wishlist."
              onConfirm={() => clearWishlist.mutate()}
              okText="Yes"
              cancelText="No"
            >
              <Button danger loading={clearWishlist.isPending}>
                Clear All
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {/* Wishlist Grid */}
      <Row gutter={[24, 24]}>
        {wishlist.map((item: WishlistItem) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              cover={
                <Link to="/products/$slug" params={{ slug: item.product.slug }}>
                  <div style={{ position: 'relative', paddingTop: '100%', background: '#f8fafc' }}>
                    <img
                      src={item.product.images?.[0] || 'https://placehold.co/400x400'}
                      alt={item.product.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {!item.product.in_stock && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(15,23,42,0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            background: 'rgba(15,23,42,0.95)',
                            color: 'white',
                            padding: '6px 14px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              }
              actions={[
                <Button
                  key="cart"
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  disabled={!item.product.in_stock}
                  loading={addToCart.isPending}
                  onClick={() => addToCart.mutate(item.product.id)}
                  block
                >
                  Add to Cart
                </Button>,
                <Popconfirm
                  key="remove"
                  title="Remove from wishlist?"
                  onConfirm={() => removeItem.mutate(item.product.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={removeItem.isPending}
                    block
                  >
                    Remove
                  </Button>
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.product.slug }}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    <div style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 8 }}>
                      {item.product.name}
                    </div>
                  </Link>
                }
                description={
                  <div>
                    {(item.product.avg_rating ?? 0) > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <Rate disabled value={item.product.avg_rating} allowHalf style={{ fontSize: 12 }} />
                        <Text style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
                          ({item.product.review_count})
                        </Text>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong style={{ fontSize: 18, color: '#6366f1' }}>
                        ${item.product.price.toFixed(2)}
                      </Text>
                      {item.product.compare_price && item.product.compare_price > item.product.price && (
                        <Text delete style={{ fontSize: 13, color: '#94a3b8' }}>
                          ${item.product.compare_price.toFixed(2)}
                        </Text>
                      )}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Continue Shopping */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <Button size="large" onClick={() => navigate({ to: '/products' })}>
          Continue Shopping
        </Button>
      </div>
    </div>
  )
}
