import { createFileRoute, Link } from '@tanstack/react-router'
import { Form, Input, Button, Card, Typography, Result } from 'antd'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { App } from 'antd'
import { getErrorMessage } from '@/lib/error'
import { useState } from 'react'

const { Title, Text } = Typography

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { message } = App.useApp()
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  const mutation = useMutation({
    mutationFn: (values: { email: string }) => authApi.forgotPassword(values.email),
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err, 'Failed to send reset email'))
    },
  })

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <Result
            status="success"
            title="Check your email"
            subTitle={
              <Text>
                We've sent a password reset link to <strong>{email}</strong>. 
                The link will expire in 60 minutes.
              </Text>
            }
            extra={[
              <Link to="/auth/login" key="login">
                <Button type="primary" icon={<ArrowLeftOutlined />}>
                  Back to Login
                </Button>
              </Link>,
              <Button key="retry" onClick={() => setSubmitted(false)}>
                Try another email
              </Button>,
            ]}
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: '8px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
          <Title level={2} style={{ margin: 0, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Forgot Password
          </Title>
          <Text type="secondary">Enter your email and we'll send you a reset link</Text>
        </div>

        <Form
          layout="vertical"
          onFinish={(values) => {
            setEmail(values.email)
            mutation.mutate(values)
          }}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input prefix={<MailOutlined />} size="large" placeholder="your@email.com" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={mutation.isPending}
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}
            >
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/auth/login">
            <Button type="link" icon={<ArrowLeftOutlined />}>Back to Login</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
