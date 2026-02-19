import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Form, Input, Button, Typography, Alert, Checkbox, Steps } from 'antd'
import {
  UserOutlined, MailOutlined, LockOutlined, PhoneOutlined,
  ArrowRightOutlined, CheckCircleFilled,
} from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useState } from 'react'
import { getErrorMessage, getFieldErrors } from '@/lib/error'
import type { RegisterPayload } from '@/types'

const { Title, Text, Paragraph } = Typography

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

const PERKS = [
  'Free shipping on first order',
  'Exclusive member-only deals',
  'Priority customer support',
  'Easy returns within 30 days',
]

function RegisterPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [error, setError] = useState('')

  const registerMutation = useMutation({
    mutationFn: (values: RegisterPayload) => authApi.register(values),
    onSuccess: (_, variables) => {
      navigate({ to: '/auth/verify-otp', search: { email: variables.email } })
    },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }) => {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        form.setFields(
          Object.entries(fieldErrors).map(([name, message]) => ({ name, errors: [message] }))
        )
      }
      setError(getErrorMessage(err, 'Registration failed. Please try again.'))
    },
  })

  return (
    <div className="auth-page">
      {/* ── Left Branding Sidebar ── */}
      <div
        className="auth-sidebar"
        aria-hidden="true"
        style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)', position: 'relative', overflow: 'hidden' }}
      >
        {/* Bubbles */}
        <div style={{ position: 'absolute', top: '8%', right: '-10%', width: 240, height: 240, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-8%', width: 300, height: 300, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

        <div className="auth-sidebar-content" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 64, height: 64,
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>🛍️</div>
          </div>

          <Title level={2} style={{ color: 'white', margin: '0 0 12px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Join Laracom
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
            Create a free account and unlock exclusive benefits for members.
          </Paragraph>

          {/* Perks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {PERKS.map((perk) => (
              <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircleFilled style={{ color: '#86efac', fontSize: 16, flexShrink: 0 }} />
                <Text style={{ color: 'rgba(255,255,255,0.83)', fontSize: 14 }}>{perk}</Text>
              </div>
            ))}
          </div>

          {/* Steps Process */}
          <div style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 14, padding: '18px 20px', backdropFilter: 'blur(8px)',
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
              Quick Setup
            </Text>
            <Steps
              size="small"
              direction="vertical"
              current={0}
              style={{ '--steps-active-color': '#a5b4fc' } as React.CSSProperties}
              items={[
                { title: <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Create account</span> },
                { title: <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Verify email</span> },
                { title: <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Start shopping</span> },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="auth-panel">
        <div className="auth-card">
          <div style={{ marginBottom: 28 }}>
            <Title level={3} style={{ margin: '0 0 6px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
              Create your account
            </Title>
            <Text style={{ color: '#64748b', fontSize: 15 }}>
              Already have an account?{' '}
              <Link to="/auth/login" style={{ color: '#6366f1', fontWeight: 600 }}>
                Sign in
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
            form={form}
            layout="vertical"
            onFinish={(values) => { setError(''); registerMutation.mutate(values) }}
            autoComplete="on"
            requiredMark={false}
          >
            <Form.Item
              name="name"
              label={<span style={{ fontWeight: 600, fontSize: 13.5 }}>Full name</span>}
              rules={[
                { required: true, message: 'Please enter your full name' },
                { min: 2, message: 'Name must be at least 2 characters' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Jane Smith"
                size="large"
                autoComplete="name"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600, fontSize: 13.5 }}>Email address</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                placeholder="you@example.com"
                size="large"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span style={{ fontWeight: 600, fontSize: 13.5 }}>Phone number</span>}
              rules={[{ required: true, message: 'Please enter your phone number' }]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                placeholder="+1 (555) 000-0000"
                size="large"
                autoComplete="tel"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600, fontSize: 13.5 }}>Password</span>}
              rules={[
                { required: true, message: 'Please create a password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Minimum 8 characters"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="password_confirmation"
              label={<span style={{ fontWeight: 600, fontSize: 13.5 }}>Confirm password</span>}
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve()
                    return Promise.reject(new Error('Passwords do not match'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Repeat your password"
                size="large"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="terms"
              valuePropName="checked"
              rules={[{
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('You must accept the terms')),
              }]}
              style={{ marginBottom: 20 }}
            >
              <Checkbox style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>
                I agree to the{' '}
                <Link to="/" style={{ color: '#6366f1', fontWeight: 500 }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/" style={{ color: '#6366f1', fontWeight: 500 }}>Privacy Policy</Link>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={registerMutation.isPending}
                icon={!registerMutation.isPending ? <ArrowRightOutlined /> : undefined}
                iconPosition="end"
                style={{ fontWeight: 700, fontSize: 15 }}
              >
                {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
              </Button>
            </Form.Item>
          </Form>

          <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block', textAlign: 'center', lineHeight: 1.6 }}>
            You'll receive a verification email to confirm your account.
          </Text>
        </div>
      </div>
    </div>
  )
}
