import { Row, Col, Typography, Space, Divider, Button, Input, Tooltip } from 'antd'
import { Link } from '@tanstack/react-router'
import {
  GithubOutlined, TwitterOutlined, InstagramOutlined,
  LinkedinOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
  ArrowRightOutlined, HeartFilled,
} from '@ant-design/icons'

const { Text, Title } = Typography

const FOOTER_LINKS = {
  shop: [
    { label: 'All Products',   to: '/products' },
    { label: 'New Arrivals',   to: '/products', search: { sort: 'newest' } },
    { label: 'Best Sellers',   to: '/products', search: { sort: 'popular' } },
    { label: 'In Stock',       to: '/products', search: { in_stock: true } },
  ],
  account: [
    { label: 'Sign In',        to: '/auth/login' },
    { label: 'Create Account', to: '/auth/register' },
    { label: 'My Orders',      to: '/orders' },
    { label: 'Track Order',    to: '/track' },
  ],
  support: [
    { label: 'Help Center',    to: '/' },
    { label: 'Returns Policy', to: '/' },
    { label: 'Privacy Policy', to: '/' },
    { label: 'Terms of Use',   to: '/' },
  ],
}

const SOCIALS = [
  { icon: <GithubOutlined />,    label: 'GitHub' },
  { icon: <TwitterOutlined />,   label: 'Twitter' },
  { icon: <InstagramOutlined />, label: 'Instagram' },
  { icon: <LinkedinOutlined />,  label: 'LinkedIn' },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: '#0c1120',
        color: '#94a3b8',
        paddingTop: 64,
        marginTop: 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
      role="contentinfo"
    >
      {/* Decorative gradient orb */}
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 200,
        background: 'radial-gradient(ellipse at center, rgb(99 102 241 / 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="page-container" style={{ position: 'relative' }}>
        <Row gutter={[40, 40]}>
          {/* Brand Column */}
          <Col xs={24} sm={24} md={7} lg={7}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: 10,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, boxShadow: '0 4px 12px rgb(99 102 241 / 0.4)',
              }}>🛍️</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em' }}>
                Lara<span style={{ color: '#818cf8' }}>com</span>
              </span>
            </Link>
            <Text style={{ color: '#64748b', lineHeight: 1.75, display: 'block', fontSize: 14, maxWidth: 260, marginBottom: 20 }}>
              Your one-stop destination for quality products at unbeatable prices. Shop with confidence.
            </Text>

            {/* Contact Info */}
            <Space direction="vertical" size={8} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <MailOutlined style={{ color: '#6366f1' }} />
                <Text style={{ color: '#64748b' }}>support@laracom.io</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <PhoneOutlined style={{ color: '#6366f1' }} />
                <Text style={{ color: '#64748b' }}>+1 (800) 123-4567</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <EnvironmentOutlined style={{ color: '#6366f1' }} />
                <Text style={{ color: '#64748b' }}>San Francisco, CA 94102</Text>
              </div>
            </Space>

            {/* Social Icons */}
            <Space size={8}>
              {SOCIALS.map(({ icon, label }) => (
                <Tooltip key={label} title={label}>
                  <Button
                    type="text"
                    aria-label={label}
                    icon={icon}
                    style={{
                      color: '#64748b', background: '#1e2d40',
                      border: '1px solid #1e3a5f',
                      borderRadius: 10, width: 36, height: 36,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#818cf8'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#64748b'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1e3a5f'
                    }}
                  />
                </Tooltip>
              ))}
            </Space>
          </Col>

          {/* Links Columns */}
          {([
            { title: 'Shop',    links: FOOTER_LINKS.shop },
            { title: 'Account', links: FOOTER_LINKS.account },
            { title: 'Support', links: FOOTER_LINKS.support },
          ] as const).map(({ title, links }) => (
            <Col xs={12} sm={8} md={4} lg={4} key={title}>
              <Title level={5} style={{ color: '#e2e8f0', marginBottom: 16, fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>
                {title}
              </Title>
              <Space direction="vertical" size={10}>
                {links.map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to as '/'}
                    style={{
                      color: '#64748b', fontSize: 13, fontWeight: 400,
                      textDecoration: 'none', transition: 'color 0.15s',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#a5b4fc')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
                  >
                    {label}
                  </Link>
                ))}
              </Space>
            </Col>
          ))}

          {/* Newsletter Column */}
          <Col xs={24} sm={24} md={9} lg={9}>
            <Title level={5} style={{ color: '#e2e8f0', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>
              Stay in the loop
            </Title>
            <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, display: 'block', marginBottom: 16 }}>
              Subscribe to our newsletter for exclusive deals and the latest arrivals.
            </Text>
            <Space.Compact style={{ width: '100%', maxWidth: 360 }}>
              <Input
                placeholder="youremail@example.com"
                size="large"
                style={{ background: '#1a2638', borderColor: '#1e3a5f', color: '#e2e8f0' }}
                aria-label="Email for newsletter"
              />
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                aria-label="Subscribe to newsletter"
              >
                Subscribe
              </Button>
            </Space.Compact>
            <Text style={{ fontSize: 11, color: '#475569', marginTop: 8, display: 'block' }}>
              No spam. Unsubscribe anytime.
            </Text>
          </Col>
        </Row>

        <Divider style={{ borderColor: '#1e293b', margin: '40px 0 24px' }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, paddingBottom: 24,
        }}>
          <Text style={{ color: '#475569', fontSize: 13 }}>
            © {new Date().getFullYear()} Laracom. All rights reserved.
          </Text>
          <Text style={{ color: '#475569', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            Crafted with <HeartFilled style={{ color: '#ef4444', fontSize: 12 }} /> using Laravel + React
          </Text>
        </div>
      </div>
    </footer>
  )
}
