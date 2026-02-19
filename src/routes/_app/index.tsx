import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Button, Typography, Row, Col, Space, Skeleton,
  Divider,
} from 'antd'
import {
  ArrowRightOutlined,
  CarOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
  ThunderboltOutlined,
  StarFilled,
  FireOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/api/products'
import ProductCard from '@/components/shared/ProductCard'

const { Title, Text, Paragraph } = Typography

export const Route = createFileRoute('/_app/')({
  component: HomePage,
})

// ── Category icon map (emoji fallback) ────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  electronics: '💻',
  clothing:    '👗',
  shoes:       '👟',
  furniture:   '🛋️',
  books:       '📚',
  sports:      '⚽',
  beauty:      '💄',
  toys:        '🧸',
  food:        '🍔',
  garden:      '🌱',
  default:     '🏷️',
}

const getCategoryIcon = (slug: string) =>
  CATEGORY_ICONS[slug.toLowerCase()] ?? CATEGORY_ICONS['default']

// ── Trust/Feature items ────────────────────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: <CarOutlined />,              label: 'Free Shipping',       desc: 'On orders over $50' },
  { icon: <SafetyOutlined />,           label: 'Secure Payments',     desc: '256-bit SSL encryption' },
  { icon: <CustomerServiceOutlined />,  label: '24/7 Support',        desc: "We're always here" },
  { icon: <ThunderboltOutlined />,      label: 'Fast Delivery',       desc: '2–3 business days' },
]

function HomePage() {
  const navigate = useNavigate()

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.featured().then((r) => r.data.data),
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data.data),
  })

  return (
    <>
      {/* ══════════════════════════════ HERO ══════════════════════════════════ */}
      <section className="hero-section" aria-label="Welcome banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">
            <FireOutlined />
            New Season Sale — Up to 50% Off
          </div>

          <h1 className="hero-title">
            Discover Products<br />You'll <em style={{ fontStyle: 'normal', color: '#c4b5fd' }}>Love</em>
          </h1>

          <p className="hero-subtitle">
            Curated collections of premium products delivered to your door.
            Quality you can trust, prices you'll celebrate.
          </p>

          <div className="hero-cta-group">
            <Button
              size="large"
              className="hero-btn-primary"
              onClick={() => navigate({ to: '/products' })}
              icon={<AppstoreOutlined />}
            >
              Shop Now
            </Button>
            <Button
              size="large"
              className="hero-btn-outline"
              onClick={() => navigate({ to: '/products', search: { sort: 'newest' } })}
              icon={<ArrowRightOutlined />}
            >
              New Arrivals
            </Button>
          </div>

          {/* Social Proof Numbers */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 40,
            marginTop: 48, flexWrap: 'wrap',
            animation: 'fadeInUp 0.45s ease 0.25s both',
          }}>
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '10K+', label: 'Products' },
              { value: '4.9',  label: 'Average Rating', icon: <StarFilled style={{ fontSize: 10, color: '#fbbf24' }} /> },
              { value: '99%',  label: 'Satisfaction Rate' },
            ].map(({ value, label, icon }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', lineHeight: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {icon}{value}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ TRUST BAR ══════════════════════════════════ */}
      <div className="trust-bar" role="list" aria-label="Service guarantees">
        <div className="page-container">
          <Row gutter={[0, 0]} justify="center">
            {TRUST_ITEMS.map(({ icon, label, desc }, idx) => (
              <Col key={label} xs={12} sm={12} md={6} role="listitem">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  justifyContent: 'center', padding: '10px 12px',
                  borderRight: idx < TRUST_ITEMS.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div className="trust-bar-icon">{icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{label}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.3 }}>{desc}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      <div className="page-container section-gap">

        {/* ══════════════════════════ CATEGORIES ══════════════════════════════ */}
        <section aria-label="Product categories" style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="section-eyebrow">Browse</span>
              <h2 className="section-title" style={{ margin: 0 }}>Shop by Category</h2>
            </div>
            <Link to="/products" style={{ color: '#6366f1', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
              All Categories <ArrowRightOutlined />
            </Link>
          </div>

          {categoriesLoading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Col xs={12} sm={8} md={4} key={i}>
                  <Skeleton.Button active block style={{ height: 96, borderRadius: 14 }} />
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[12, 12]}>
              {categories?.map((cat) => (
                <Col xs={12} sm={8} md={4} key={cat.id}>
                  <Link
                    to="/products"
                    search={{ category: cat.slug }}
                    className="category-card"
                    aria-label={`Browse ${cat.name}`}
                  >
                    <div className="category-icon" style={{ margin: '0 auto 10px' }}>
                      {getCategoryIcon(cat.slug)}
                    </div>
                    <Text strong style={{ fontSize: 13, color: 'inherit', display: 'block' }}>
                      {cat.name}
                    </Text>
                    {cat.products_count !== undefined && (
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'block' }}>
                        {cat.products_count} items
                      </Text>
                    )}
                  </Link>
                </Col>
              ))}
            </Row>
          )}
        </section>

        {/* ══════════════════════════ FEATURED PRODUCTS ═══════════════════════ */}
        <section aria-label="Featured products" style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="section-eyebrow">Handpicked</span>
              <h2 className="section-title" style={{ margin: 0 }}>Featured Products</h2>
            </div>
            <Button
              type="link"
              onClick={() => navigate({ to: '/products' })}
              style={{ color: '#6366f1', fontWeight: 600, padding: 0 }}
            >
              View All <ArrowRightOutlined />
            </Button>
          </div>

          {featuredLoading ? (
            <Row gutter={[20, 20]}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Col xs={24} sm={12} md={8} lg={6} key={i}>
                  <Skeleton active style={{ borderRadius: 14 }} />
                </Col>
              ))}
            </Row>
          ) : (featured?.length ?? 0) === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛍️</div>
              <Text type="secondary">No featured products yet. Check back soon!</Text>
            </div>
          ) : (
            <Row gutter={[20, 20]}>
              {featured?.map((product, i) => (
                <Col xs={24} sm={12} md={8} lg={6} key={product.id}
                  style={{ animation: `fadeInUp 0.4s ease ${i * 0.06}s both` }}
                >
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          )}
        </section>

        {/* ══════════════════════════ FEATURES SECTION ════════════════════════ */}
        <section aria-label="Why choose us" style={{ marginBottom: 32 }}>
          <Divider style={{ marginBottom: 48 }} />
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span className="section-eyebrow">Why Laracom?</span>
            <h2 className="section-title" style={{ margin: '0 auto', maxWidth: 400 }}>
              Shopping made simple and secure
            </h2>
          </div>

          <Row gutter={[20, 20]}>
            {[
              {
                icon: '🛡️', color: '#eef2ff', iconBg: '#4f46e5',
                title: 'Buyer Protection',
                desc: 'Shop with confidence. Every purchase is protected with our money-back guarantee.',
              },
              {
                icon: '🚀', color: '#f0fdf4', iconBg: '#16a34a',
                title: 'Lightning Fast',
                desc: 'Optimized experience that gets you from browsing to checkout in seconds.',
              },
              {
                icon: '💎', color: '#fff7ed', iconBg: '#d97706',
                title: 'Premium Quality',
                desc: 'Every product is vetted for quality. Only the best makes it to our shelves.',
              },
              {
                icon: '🔄', color: '#fdf2f8', iconBg: '#9333ea',
                title: 'Easy Returns',
                desc: 'Not happy? Return any item within 30 days for a full refund, no questions asked.',
              },
            ].map(({ icon, color, title, desc }) => (
              <Col xs={24} sm={12} lg={6} key={title}>
                <div className="feature-card">
                  <div
                    className="feature-icon"
                    style={{ background: color, fontSize: 28 }}
                  >
                    {icon}
                  </div>
                  <Title level={5} style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>
                    {title}
                  </Title>
                  <Paragraph style={{ margin: 0, color: '#64748b', fontSize: 13.5, lineHeight: 1.65 }}>
                    {desc}
                  </Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </section>

        {/* ══════════════════════════ CTA BANNER ══════════════════════════════ */}
        <section aria-label="Newsletter sign up" style={{ marginTop: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)',
            borderRadius: 20, padding: 'clamp(32px, 6vw, 56px) clamp(24px, 5vw, 64px)',
            display: 'flex', flexWrap: 'wrap', gap: 24,
            alignItems: 'center', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -60, left: 40, width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

            <div style={{ position: 'relative' }}>
              <Title level={3} style={{ color: 'white', margin: '0 0 8px', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800 }}>
                Ready to start shopping?
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>
                Join 50,000+ happy customers. Get exclusive deals in your inbox.
              </Text>
            </div>
            <Space wrap style={{ position: 'relative' }}>
              <Button
                size="large"
                style={{
                  background: 'white', color: '#4f46e5', border: 'none',
                  fontWeight: 700, borderRadius: 10,
                  boxShadow: '0 4px 16px rgb(0 0 0 / 0.2)',
                }}
                onClick={() => navigate({ to: '/products' })}
              >
                Browse Products
              </Button>
              <Button
                size="large"
                ghost
                style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', fontWeight: 600, borderRadius: 10 }}
                onClick={() => navigate({ to: '/auth/register' })}
              >
                Create Free Account
              </Button>
            </Space>
          </div>
        </section>

      </div>
    </>
  )
}
