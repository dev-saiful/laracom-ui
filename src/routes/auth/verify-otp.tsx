import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Form, Input, Button, Card, Typography, Alert, message as antMessage } from 'antd'
import { NumberOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { getErrorMessage } from '@/lib/error'
import { useState } from 'react'

const { Title, Text } = Typography

interface VerifySearch {
  email: string
}

export const Route = createFileRoute('/auth/verify-otp')({
  component: VerifyOtpPage,
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    email: (search.email as string) || '',
  }),
})

function VerifyOtpPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/auth/verify-otp' })
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const verifyMutation = useMutation({
    mutationFn: (otp: string) => authApi.verifyOtp({ email: search.email, otp }),
    onSuccess: (res) => {
      const { user, access_token, refresh_token } = res.data.data
      setAuth(user, access_token, refresh_token)
      navigate({ to: '/' })
      antMessage.success('Account verified successfully!')
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Invalid or expired OTP'))
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp(search.email),
    onSuccess: () => {
      antMessage.success('OTP sent to your email')
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) clearInterval(interval)
          return prev - 1
        })
      }, 1000)
    },
    onError: () => {
      antMessage.error('Failed to resend OTP')
    },
  })

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ color: '#6366f1', marginBottom: 8 }}>Verify Email</Title>
          <Text type="secondary">Enter the OTP sent to <Text strong>{search.email}</Text></Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}

        <Form
          layout="vertical"
          onFinish={(values) => verifyMutation.mutate(values.otp)}
          size="large"
        >
          <Form.Item
            name="otp"
            rules={[{ required: true, message: 'Please input the OTP!' }, { len: 6, message: 'OTP must be 6 digits' }]}
          >
            <Input 
              prefix={<NumberOutlined />} 
              placeholder="Enter 6-digit OTP" 
              maxLength={6} 
              style={{ textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={verifyMutation.isPending}>
              Verify Account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Didn't receive code? </Text>
          <Button 
            type="link" 
            onClick={() => resendMutation.mutate()} 
            disabled={resendCooldown > 0 || resendMutation.isPending}
            style={{ padding: 0 }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
