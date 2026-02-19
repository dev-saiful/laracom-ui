import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Row, Col, Typography, Button, Rate, Tag, Divider,
  InputNumber, Space, Image, Tabs, Avatar, List, Breadcrumb,
  Form, Input, Modal, Popconfirm, Tooltip
} from 'antd'
import {
  ShoppingCartOutlined, CheckCircleOutlined, LikeOutlined,
  EditOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { cartApi } from '@/api/cart'
import { reviewsApi } from '@/api/reviews'
import { getErrorMessage } from '@/lib/error'
import ProductCard from '@/components/shared/ProductCard'
import { useState } from 'react'
import { App } from 'antd'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'
import type { Review } from '@/types'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export const Route = createFileRoute('/_app/products/$slug')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { slug } = Route.useParams()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [reviewForm] = Form.useForm()

  // 1. Fetch product
  const { data: productResp, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.show(slug).then((r) => r.data),
  })
  const product = productResp?.data

  // 2. Fetch related
  const { data: relatedResp } = useQuery({
    queryKey: ['related', slug],
    queryFn: () => productsApi.related(slug).then((r) => r.data),
    enabled: !!product,
  })

  // 3. Fetch reviews
  const { data: reviewsResp } = useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => reviewsApi.list(slug).then((r) => r.data),
    enabled: !!product,
  })

  const addToCart = useMutation({
    mutationFn: () => cartApi.addItem({
      product_id: product!.id,
      product_variant_id: selectedVariantId || undefined,
      quantity,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      message.success('Added to cart')
    },
    onError: (err: unknown) => message.error(getErrorMessage(err, 'Failed to add to cart')),
  })

  // ─── Review mutations ────────────────────────────────────────────────────────
  const submitReview = useMutation({
    mutationFn: (values: { rating: number; title?: string; body?: string }) => {
      if (editingReview) {
        return reviewsApi.update(editingReview.id, values)
      }
      return reviewsApi.store({ product_id: product!.id, ...values })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      queryClient.invalidateQueries({ queryKey: ['product', slug] })
      message.success(editingReview ? 'Review updated' : 'Review submitted')
      setReviewModalOpen(false)
      setEditingReview(null)
      reviewForm.resetFields()
    },
    onError: (err: unknown) => message.error(getErrorMessage(err, 'Failed to submit review')),
  })

  const deleteReview = useMutation({
    mutationFn: (id: string) => reviewsApi.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      queryClient.invalidateQueries({ queryKey: ['product', slug] })
      message.success('Review deleted')
    },
    onError: () => message.error('Failed to delete review'),
  })

  const markHelpful = useMutation({
    mutationFn: (id: string) => reviewsApi.markHelpful(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', slug] }),
    onError: () => message.error('Failed to mark review'),
  })

  const openEditReview = (review: Review) => {
    setEditingReview(review)
    reviewForm.setFieldsValue({ rating: review.rating, title: review.title, body: review.body })
    setReviewModalOpen(true)
  }

  const openNewReview = () => {
    setEditingReview(null)
    reviewForm.resetFields()
    setReviewModalOpen(true)
  }

  if (isLoading) return <div className="page-container section-gap">Loading...</div>
  if (!product) return <div className="page-container section-gap">Product not found</div>

  const currentVariant = product.variants?.find((v) => v.id === selectedVariantId)
  const price = currentVariant ? currentVariant.price : product.price
  const stock = currentVariant ? currentVariant.stock : product.stock
  const inStock = stock > 0

  return (
    <div className="page-container section-gap">
      <Breadcrumb
        items={[
          { title: <Link to="/">Home</Link> },
          { title: <Link to="/products">Products</Link> },
          { title: product.name },
        ]}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[48, 32]}>
        {/* Gallery */}
        <Col xs={24} md={12}>
          <Image.PreviewGroup>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <Image src={product.images?.[0]} width="100%" />
            </div>
            <Space size={12} wrap>
              {product.images?.slice(1).map((img, i) => (
                <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <Image src={img} width="100%" height="100%" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </Space>
          </Image.PreviewGroup>
        </Col>

        {/* Info */}
        <Col xs={24} md={12}>
          {product.category && (
            <Text type="secondary" style={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, fontWeight: 600 }}>
              {product.category.name}
            </Text>
          )}
          <Title level={2} style={{ marginTop: 8 }}>{product.name}</Title>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <Rate disabled allowHalf defaultValue={product.avg_rating || 0} />
            <Text type="secondary">({product.review_count} reviews)</Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0, color: '#6366f1' }}>${price.toFixed(2)}</Title>
            {product.discount_percentage && product.discount_percentage > 0 && (
              <Tag color="red">-{product.discount_percentage}% OFF</Tag>
            )}
            <Tag color={inStock ? 'green' : 'red'}>{inStock ? 'In Stock' : 'Out of Stock'}</Tag>
          </div>

          <Paragraph type="secondary" style={{ fontSize: 16 }}>{product.short_description}</Paragraph>

          <Divider />

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Option:</Text>
              <Space wrap>
                {product.variants.map((v) => (
                  <Button
                    key={v.id}
                    type={selectedVariantId === v.id ? 'primary' : 'default'}
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={v.stock === 0}
                  >
                    {v.name}
                  </Button>
                ))}
              </Space>
            </div>
          )}

          {/* Add to Cart */}
          <Space size={16} align="end">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Quantity</Text>
              <InputNumber min={1} max={stock} value={quantity} onChange={(v) => setQuantity(v || 1)} size="large" />
            </div>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={() => addToCart.mutate()}
              loading={addToCart.isPending}
              disabled={!inStock}
              style={{ padding: '0 40px' }}
            >
              Add to Cart
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Tabs */}
      <div style={{ marginTop: 64 }}>
        <Tabs
          items={[
            {
              key: 'desc',
              label: 'Description',
              children: <div dangerouslySetInnerHTML={{ __html: product.description || '' }} style={{ maxWidth: 800 }} />,
            },
            {
              key: 'reviews',
              label: `Reviews (${product.review_count})`,
              children: (
                <div>
                  {/* Rating summary */}
                  {(reviewsResp?.data?.length ?? 0) > 0 && (
                    <Row gutter={32} style={{ marginBottom: 32 }}>
                      <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 64, fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>
                          {product.avg_rating?.toFixed(1) ?? '—'}
                        </div>
                        <Rate disabled allowHalf value={product.avg_rating ?? 0} style={{ fontSize: 20 }} />
                        <div style={{ color: '#64748b', marginTop: 4 }}>{product.review_count} review{product.review_count !== 1 ? 's' : ''}</div>
                      </Col>
                    </Row>
                  )}

                  {/* Write review button */}
                  {isAuthenticated && (
                    <div style={{ marginBottom: 24 }}>
                      <Button type="primary" onClick={openNewReview} icon={<EditOutlined />}>
                        Write a Review
                      </Button>
                    </div>
                  )}
                  {!isAuthenticated && (
                    <div style={{ marginBottom: 24 }}>
                      <Text type="secondary">
                        <Link to="/auth/login">Sign in</Link> to write a review.
                      </Text>
                    </div>
                  )}

                  {/* Reviews list */}
                  <List
                    itemLayout="horizontal"
                    dataSource={reviewsResp?.data ?? []}
                    locale={{ emptyText: 'No reviews yet. Be the first!' }}
                    renderItem={(review) => {
                      const isOwner = user?.id === review.user?.id
                      return (
                        <List.Item
                          actions={[
                            <Tooltip title="Helpful" key="helpful">
                              <Button
                                size="small"
                                type="text"
                                icon={<LikeOutlined />}
                                onClick={() => markHelpful.mutate(review.id)}
                                loading={markHelpful.isPending}
                              >
                                {review.helpful_count > 0 ? review.helpful_count : ''}
                              </Button>
                            </Tooltip>,
                            ...(isOwner ? [
                              <Button key="edit" size="small" type="text" icon={<EditOutlined />}
                                onClick={() => openEditReview(review)}>Edit</Button>,
                              <Popconfirm key="del" title="Delete this review?" onConfirm={() => deleteReview.mutate(review.id)}>
                                <Button size="small" type="text" danger icon={<DeleteOutlined />}
                                  loading={deleteReview.isPending}>Delete</Button>
                              </Popconfirm>,
                            ] : []),
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar style={{ backgroundColor: '#6366f1' }}>
                              {review.user?.name?.[0]?.toUpperCase() ?? '?'}
                            </Avatar>}
                            title={
                              <Space wrap>
                                <Text strong>{review.user?.name ?? 'Anonymous'}</Text>
                                <Rate disabled defaultValue={review.rating} style={{ fontSize: 13 }} />
                                {review.title && <Text strong style={{ color: '#374151' }}>{review.title}</Text>}
                                {review.is_verified_purchase && (
                                  <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 11 }}>Verified</Tag>
                                )}
                              </Space>
                            }
                            description={
                              <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {dayjs(review.created_at).format('MMM D, YYYY')}
                                </Text>
                                {review.body && (
                                  <Paragraph style={{ marginTop: 6, marginBottom: 0 }}>{review.body}</Paragraph>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Related Products */}
      {relatedResp?.data && relatedResp.data.length > 0 && (
        <div style={{ marginTop: 64 }}>
          <Title level={3} style={{ marginBottom: 24 }}>Related Products</Title>
          <Row gutter={[24, 24]}>
            {relatedResp.data.map((p) => (
              <Col xs={24} sm={12} md={6} key={p.id}>
                <ProductCard product={p} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Review Form Modal */}
      <Modal
        title={editingReview ? 'Edit Your Review' : 'Write a Review'}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={() => reviewForm.submit()}
        confirmLoading={submitReview.isPending}
        destroyOnClose
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={(values) => submitReview.mutate(values)}
        >
          <Form.Item name="rating" label="Rating" rules={[{ required: true, message: 'Please give a rating' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please add a title' }]}>
            <Input placeholder="Summarise your experience" maxLength={100} />
          </Form.Item>
          <Form.Item name="body" label="Review">
            <TextArea rows={4} placeholder="Tell others what you think about this product..." maxLength={2000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
