import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Form, Input, Button, Card, Typography, Alert } from 'antd'
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { App } from 'antd'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/error'

const { Title, Text } = Typography

const searchSchema = z.object({
  token: z.string().optional().default(''),
  email: z.string().optional().default(''),
})

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { token, email } = Route.useSearch()
  const [form] = Form.useForm()

  const mutation = useMutation({
    mutationFn: (values: { password: string; password_confirmation: string }) =>
      authApi.resetPassword({
        email: form.getFieldValue('email') || email,
        token: form.getFieldValue('token') || token,
        password: values.password,
        password_confirmation: values.password_confirmation,
      }),
    onSuccess: () => {
      message.success('Password reset successfully! Please log in with your new password.')
      navigate({ to: '/auth/login' })
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err, 'Failed to reset password'))
    },
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: '8px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
          <Title level={2} style={{ margin: 0, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Reset Password
          </Title>
          <Text type="secondary">Enter your new password below</Text>
        </div>

        {!token && (
          <Alert
            message="No reset token found"
            description="Please use the link from your email or enter your token manually below."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          initialValues={{ email, token }}
          onFinish={mutation.mutate}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input size="large" placeholder="your@email.com" />
          </Form.Item>

          {!token && (
            <Form.Item
              name="token"
              label="Reset Token"
              rules={[{ required: true, message: 'Please enter your reset token' }]}
            >
              <Input size="large" placeholder="Paste token from email" />
            </Form.Item>
          )}

          <Form.Item
            name="password"
            label="New Password"
            rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="New password (min 8 chars)" />
          </Form.Item>

          <Form.Item
            name="password_confirmation"
            label="Confirm New Password"
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
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="Confirm new password" />
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
              Reset Password
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
