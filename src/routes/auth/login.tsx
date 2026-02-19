import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Form, Input, Button, Typography, Alert, Checkbox, Divider } from 'antd'
import { UserOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { useState } from 'react'

const { Title, Text, Paragraph } = Typography

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      const { user, access_token, refresh_token } = res.data.data
      setAuth(user, access_token, refresh_token)
      navigate({ to: user.role === 'admin' ? '/admin' : '/' })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message || 'Invalid email or password. Please try again.')
    },
  })

  return (
    <div className="auth-page">
      {/* ── Left Branding Sidebar ── */}
      <div
        className="auth-sidebar"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(145deg, #3730a3 0%, #6d28d9 50%, #7c3aed 100%)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Background bubbles */}
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '-5%', width: 280, height: 280, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '55%', right: '-8%', width: 160, height: 160, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />

        <div className="auth-sidebar-content" style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 64, height: 64,
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>🛍️</div>
          </div>

          <Title level={2} style={{ color: 'white', margin: '0 0 12px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Welcome back!
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7, margin: '0 0 40px' }}>
            Sign in to access your orders, wishlist, and exclusive member deals.
          </Paragraph>

          {/* Mini Feature List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '🚀', text: 'Faster checkout with saved details' },
              { icon: '📦', text: 'Track all your orders in one place' },
              { icon: '💝', text: 'Exclusive deals for members' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, flexShrink: 0,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {icon}
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 1.4 }}>{text}</Text>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div style={{
            marginTop: 48, background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 14, padding: '16px 20px',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
              ))}
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13.5, lineHeight: 1.6 }}>
              "Best shopping experience ever! Fast delivery and amazing product quality."
            </Text>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>— Sarah K., Verified Customer</Text>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="auth-panel">
        <div className="auth-card">
          {/* Mobile Logo */}
          <Link to="/" style={{
            display: 'none', alignItems: 'center', gap: 8,
            textDecoration: 'none', marginBottom: 32,
          }} className="auth-mobile-logo">
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em' }}>
              🛍️ Lara<span style={{ color: '#6366f1' }}>com</span>
            </span>
          </Link>

          <div style={{ marginBottom: 32 }}>
            <Title level={3} style={{ margin: '0 0 6px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
              Sign in to your account
            </Title>
            <Text style={{ color: '#64748b', fontSize: 15 }}>
              Don't have an account?{' '}
              <Link to="/auth/register" style={{ color: '#6366f1', fontWeight: 600 }}>
                Create one free
              </Link>
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
              style={{ marginBottom: 24, borderRadius: 10 }}
            />
          )}

          <Form
            layout="vertical"
            onFinish={(values) => { setError(''); loginMutation.mutate(values) }}
            autoComplete="on"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600, fontSize: 13.5 }}>Email address</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Enter a valid email address' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="you@example.com"
                size="large"
                autoComplete="email"
                aria-label="Email address"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>Password</span>
                  <Link to="/auth/forgot-password" style={{ color: '#6366f1', fontSize: 13, fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
              }
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Enter your password"
                size="large"
                autoComplete="current-password"
                aria-label="Password"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 20 }}>
              <Checkbox style={{ fontSize: 14, color: '#475569' }}>
                Keep me signed in
              </Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loginMutation.isPending}
                icon={!loginMutation.isPending ? <ArrowRightOutlined /> : undefined}
                iconPosition="end"
                style={{ fontWeight: 700, fontSize: 15 }}
              >
                {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ color: '#94a3b8', fontSize: 12 }}>Or continue with</Divider>

          {/* Social login placeholder buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {['Google', 'GitHub'].map((provider) => (
              <Button
                key={provider}
                block size="large"
                style={{
                  fontWeight: 600, borderColor: '#e2e8f0', color: '#374151',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                disabled
              >
                {provider === 'Google' ? '🔍' : '🐙'} {provider}
              </Button>
            ))}
          </div>

          <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block', textAlign: 'center', lineHeight: 1.6 }}>
            By signing in, you agree to our{' '}
            <Link to="/" style={{ color: '#6366f1' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/" style={{ color: '#6366f1' }}>Privacy Policy</Link>.
          </Text>
        </div>
      </div>
    </div>
  )
}
