import { useState } from 'react'
import { Tag, Rate, Typography, Button, Tooltip } from 'antd'
import { ShoppingCartOutlined, HeartOutlined, HeartFilled, EyeOutlined } from '@ant-design/icons'
import { Link, useNavigate } from '@tanstack/react-router'
import type { Product } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { wishlistApi } from '@/api/wishlist'
import { useAuthStore } from '@/store/auth'
import { App } from 'antd'

const { Text, Title } = Typography

interface ProductCardProps {
  product: Product
  layout?: 'grid' | 'list'
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [imgError, setImgError] = useState(false)

  // Check if product is in wishlist (only for authenticated users)
  const { data: wishlistStatus } = useQuery({
    queryKey: ['wishlist-check', product.id],
    queryFn: () => wishlistApi.check(product.id).then((r) => r.data.data.in_wishlist),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  const isWishlisted = wishlistStatus ?? false

  const addToCart = useMutation({
    mutationFn: () => cartApi.addItem({ product_id: product.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      message.success({ content: `"${product.name}" added to cart!`, key: `cart-${product.id}` })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message ?? 'Failed to add to cart')
    },
  })

  const toggleWishlist = useMutation({
    mutationFn: () => isWishlisted ? wishlistApi.remove(product.id) : wishlistApi.add(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', product.id] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      message.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message ?? 'Failed to update wishlist')
    },
  })

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      message.info('Please login to add items to your wishlist')
      navigate({ to: '/auth/login' })
      return
    }
    toggleWishlist.mutate()
  }

  const imageSrc = !imgError && product.images?.[0]
    ? product.images[0]
    : `https://placehold.co/400x400/f1f5f9/94a3b8?text=${encodeURIComponent(product.name.slice(0, 12))}`

  if (layout === 'list') {
    return (
      <div
        style={{
          display: 'flex', gap: 16, padding: '16px', background: 'white',
          borderRadius: 14, border: '1px solid #f1f5f9',
          transition: 'box-shadow 0.2s, transform 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgb(0 0 0 / 0.1)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = ''
          ;(e.currentTarget as HTMLElement).style.transform = ''
        }}
      >
        <Link to="/products/$slug" params={{ slug: product.slug }} style={{ flexShrink: 0 }}>
          <img
            src={imageSrc}
            alt={product.name}
            onError={() => setImgError(true)}
            loading="lazy"
            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, display: 'block', background: '#f1f5f9' }}
          />
        </Link>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {product.category && (
            <Text style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {product.category.name}
            </Text>
          )}
          <Link to="/products/$slug" params={{ slug: product.slug }} style={{ textDecoration: 'none' }}>
            <Title level={5} style={{ margin: 0, fontSize: 15, lineHeight: 1.4, color: '#0f172a' }} ellipsis={{ rows: 1 }}>
              {product.name}
            </Title>
          </Link>
          {(product.avg_rating ?? 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Rate disabled value={product.avg_rating} allowHalf style={{ fontSize: 11 }} />
              <Text style={{ fontSize: 12, color: '#64748b' }}>({product.review_count})</Text>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
            <Text strong style={{ fontSize: 17, color: '#6366f1' }}>${product.price.toFixed(2)}</Text>
            {product.compare_price && product.compare_price > product.price && (
              <Text delete style={{ fontSize: 13, color: '#94a3b8' }}>${product.compare_price.toFixed(2)}</Text>
            )}
            <Button
              type="primary" size="small"
              icon={<ShoppingCartOutlined />}
              disabled={!product.in_stock}
              loading={addToCart.isPending}
              onClick={(e) => { e.preventDefault(); addToCart.mutate() }}
              style={{ marginLeft: 'auto' }}
            >
              {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <article
      className="product-card"
      aria-label={product.name}
    >
      {/* ── Image Area ── */}
      <div className="product-img-wrapper">
        <Link to="/products/$slug" params={{ slug: product.slug }} tabIndex={-1}>
          <img
            src={imageSrc}
            alt={product.name}
            className="product-img"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        </Link>

        {/* Badges */}
        {product.discount_percentage && product.discount_percentage > 0 && (
          <span className="discount-badge" aria-label={`${product.discount_percentage}% off`}>
            -{product.discount_percentage}%
          </span>
        )}

        {/* Out of Stock Overlay */}
        {!product.in_stock && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(2px)',
          }}>
            <span style={{
              background: 'rgba(15,23,42,0.9)', color: 'white',
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          className={`wishlist-btn${isWishlisted ? ' active' : ''}`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          onClick={handleWishlistClick}
          disabled={toggleWishlist.isPending}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'white', border: 'none',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: toggleWishlist.isPending ? 'wait' : 'pointer',
            boxShadow: '0 2px 8px rgb(0 0 0 / 0.12)',
            color: isWishlisted ? '#ef4444' : '#94a3b8',
            transition: 'all 0.2s', fontSize: 15, opacity: 0, zIndex: 2,
          }}
        >
          {isWishlisted ? <HeartFilled /> : <HeartOutlined />}
        </button>

        {/* Hover Quick Actions */}
        <div className="product-card-actions">
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            disabled={!product.in_stock}
            loading={addToCart.isPending}
            onClick={(e) => { e.preventDefault(); addToCart.mutate() }}
            style={{ flex: 1, fontWeight: 600 }}
            size="middle"
          >
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          <Tooltip title="Quick view">
            <Button
              icon={<EyeOutlined />}
              onClick={(e) => { e.preventDefault(); navigate({ to: '/products/$slug', params: { slug: product.slug } }) }}
              style={{ flexShrink: 0, borderRadius: 10 }}
            />
          </Tooltip>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Category */}
        {product.category && (
          <Text style={{
            fontSize: 10.5, color: '#6366f1', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.07em',
            display: 'block', marginBottom: 4,
          }}>
            {product.category.name}
          </Text>
        )}

        {/* Name */}
        <Link to="/products/$slug" params={{ slug: product.slug }} style={{ textDecoration: 'none' }}>
          <Title
            level={5}
            style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.45, color: '#0f172a', fontWeight: 600 }}
            ellipsis={{ rows: 2, tooltip: product.name }}
          >
            {product.name}
          </Title>
        </Link>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {!product.in_stock && <Tag color="red" style={{ fontSize: 11, margin: 0 }}>Out of Stock</Tag>}
          {product.is_featured && <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>Featured</Tag>}
        </div>

        {/* Rating */}
        {(product.avg_rating ?? 0) > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <Rate
              disabled
              allowHalf
              value={product.avg_rating}
              style={{ fontSize: 12, color: '#f59e0b' }}
            />
            <Text style={{ fontSize: 12, color: '#94a3b8' }}>({product.review_count})</Text>
          </div>
        )}

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ fontSize: 18, color: '#6366f1', letterSpacing: '-0.01em' }}>
            ${product.price.toFixed(2)}
          </Text>
          {product.compare_price && product.compare_price > product.price && (
            <Text delete style={{ fontSize: 13, color: '#94a3b8' }}>
              ${product.compare_price.toFixed(2)}
            </Text>
          )}
        </div>
      </div>
    </article>
  )
}
