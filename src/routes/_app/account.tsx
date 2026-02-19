import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Form, Input, Button, Card, Typography, Row, Col, Tabs, Avatar,
  Tag, Table, Divider, Space, Empty
} from 'antd'
import { UserOutlined, LockOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { ordersApi } from '@/api/orders'
import { useAuthStore } from '@/store/auth'
import { App } from 'antd'
import { getErrorMessage } from '@/lib/error'
import type { Order, OrderStatus } from '@/types'
import dayjs from 'dayjs'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'

const { Title, Text } = Typography

export const Route = createFileRoute('/_app/account')({
  component: AccountPage,
})

interface ProfileValues { name: string; phone?: string }
interface PasswordValues { current_password: string; password: string; password_confirmation: string }

function AccountPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const { user, setAuth, isAuthenticated } = useAuthStore()
  const [profileForm] = Form.useForm<ProfileValues>()
  const [passwordForm] = Form.useForm<PasswordValues>()

  // Hooks must run unconditionally before any early return
  const { data: ordersResp } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.history().then((r) => r.data),
    enabled: isAuthenticated,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileValues) => authApi.updateProfile({
      name: values.name,
      phone: values.phone,
    }),
    onSuccess: (res) => {
      const stored = useAuthStore.getState()
      setAuth(res.data.data!, stored.accessToken!, stored.refreshToken!)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      message.success('Profile updated successfully')
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err, 'Failed to update profile'))
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (values: PasswordValues) => authApi.updateProfile({
      current_password: values.current_password,
      password: values.password,
      password_confirmation: values.password_confirmation,
    }),
    onSuccess: () => {
      message.success('Password changed successfully')
      passwordForm.resetFields()
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err, 'Failed to change password'))
    },
  })

  if (!isAuthenticated) {
    return (
      <div className="page-container section-gap" style={{ textAlign: 'center' }}>
        <Empty description="Please log in to view your account" />
        <Link to="/auth/login">
          <Button type="primary" style={{ marginTop: 16 }}>Sign In</Button>
        </Link>
      </div>
    )
  }

  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (num: string, record: Order) => (
        <Link to="/orders/$id" params={{ id: record.id }}>
          <Text style={{ color: '#6366f1', fontWeight: 500 }}>#{num}</Text>
        </Link>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: OrderStatus) => <OrderStatusBadge status={s} />,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (t: number) => <Text strong>${t?.toFixed(2)}</Text>,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: Order) => (
        <Link to="/orders/$id" params={{ id: record.id }}>
          <Button size="small">View</Button>
        </Link>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          Profile
        </Space>
      ),
      children: (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
            <Avatar
              size={72}
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: 28 }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <Title level={3} style={{ margin: 0 }}>{user?.name}</Title>
              <Text type="secondary">{user?.email}</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color={user?.role === 'admin' ? 'gold' : 'blue'} style={{ textTransform: 'capitalize' }}>
                  {user?.role}
                </Tag>
              </div>
            </div>
          </div>

          <Divider />

          <Title level={4} style={{ marginBottom: 20 }}>Update Profile</Title>
          <Form
            form={profileForm}
            layout="vertical"
            initialValues={{ name: user?.name, phone: user?.phone }}
            onFinish={updateProfileMutation.mutate}
            style={{ maxWidth: 500 }}
          >
            <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
              <Input size="large" prefix={<UserOutlined />} />
            </Form.Item>
            <Form.Item name="phone" label="Phone Number">
              <Input size="large" placeholder="e.g. +1 234 567 8900" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={updateProfileMutation.isPending}>
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'security',
      label: (
        <Space>
          <LockOutlined />
          Security
        </Space>
      ),
      children: (
        <div>
          <Title level={4} style={{ marginBottom: 20 }}>Change Password</Title>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={changePasswordMutation.mutate}
            style={{ maxWidth: 500 }}
          >
            <Form.Item
              name="current_password"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password prefix={<LockOutlined />} size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              label="New Password"
              rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
            >
              <Input.Password prefix={<LockOutlined />} size="large" />
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
              <Input.Password prefix={<LockOutlined />} size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={changePasswordMutation.isPending} danger>
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'orders',
      label: (
        <Space>
          <ShoppingOutlined />
          My Orders ({ordersResp?.data?.length ?? 0})
        </Space>
      ),
      children: (
        <Table
          dataSource={ordersResp?.data ?? []}
          columns={orderColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No orders yet" /> }}
        />
      ),
    },
  ]

  return (
    <div className="page-container section-gap">
      <Title level={2} style={{ marginBottom: 32 }}>My Account</Title>

      <Row gutter={32}>
        <Col xs={24}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Tabs items={tabItems} size="large" />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
