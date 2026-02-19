import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Typography, Row, Col, Card, Statistic, Skeleton,
  Space, Tag, Button, Progress, Divider,
} from 'antd'
import {
  ShoppingOutlined, UserOutlined, DollarOutlined, InboxOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined,
  CheckCircleOutlined, SyncOutlined, CarOutlined,
  WarningOutlined, RightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'

const { Title, Text } = Typography

export const Route = createFileRoute('/admin/_layout/')({
  component: AdminDashboard,
})

interface StatCardProps {
  title: string
  value: number | string | undefined
  prefix?: React.ReactNode
  suffix?: string
  color: string
  bgColor: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  loading?: boolean
  precision?: number
}

function StatCard({ title, value, prefix, suffix, color, bgColor, icon, trend, trendLabel, loading, precision }: StatCardProps) {
  // Ensure value is a number for Statistic component
  const numericValue = value !== undefined && value !== null ? Number(value) : 0
  
  return (
    <Card
      className="stats-card"
      bordered={false}
      style={{ borderTop: `3px solid ${color}` }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              {title}
            </Text>
            <Statistic
              value={numericValue}
              prefix={prefix}
              suffix={suffix}
              precision={precision}
              valueStyle={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}
            />
            {trend !== undefined && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                {trend >= 0
                  ? <ArrowUpOutlined style={{ color: '#22c55e', fontSize: 12 }} />
                  : <ArrowDownOutlined style={{ color: '#ef4444', fontSize: 12 }} />}
                <Text style={{ fontSize: 12, color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {Math.abs(trend)}%
                </Text>
                {trendLabel && <Text style={{ fontSize: 12, color: '#94a3b8' }}>{trendLabel}</Text>}
              </div>
            )}
          </div>
          <div
            className="stats-card-icon"
            style={{ background: bgColor, color }}
          >
            {icon}
          </div>
        </div>
      )}
    </Card>
  )
}

function AdminDashboard() {
  const { data: orderStats, isLoading: orderLoading } = useQuery({
    queryKey: ['admin', 'orders', 'stats'],
    queryFn: () => adminApi.orders.statistics().then((r) => r.data.data),
  })

  const { data: userStats, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: () => adminApi.users.statistics().then((r) => r.data.data),
  })

  const { data: inventoryStats, isLoading: invLoading } = useQuery({
    queryKey: ['admin', 'inventory', 'stats'],
    queryFn: () => adminApi.inventory.statistics().then((r) => r.data.data),
  })

  const loading = orderLoading || userLoading || invLoading

  // Compute total active orders (confirmed + processing + shipped)
  const activeOrders = (orderStats?.confirmed ?? 0) + (orderStats?.processing ?? 0) + (orderStats?.shipped ?? 0)
  const totalOrders = orderStats?.total_orders || 1
  const deliveredPct = Math.round(((orderStats?.delivered ?? 0) / totalOrders) * 100)
  const cancelledPct = Math.round(((orderStats?.cancelled ?? 0) / totalOrders) * 100)

  const ORDER_STATUSES = [
    { label: 'Pending',    count: orderStats?.pending,    icon: <ClockCircleOutlined />,  color: '#f59e0b', bg: '#fef3c7', status: 'pending' },
    { label: 'Confirmed',  count: orderStats?.confirmed ?? 0, icon: <CheckCircleOutlined />, color: '#3b82f6', bg: '#dbeafe', status: 'confirmed' },
    { label: 'Processing', count: orderStats?.processing, icon: <SyncOutlined spin />,   color: '#8b5cf6', bg: '#ede9fe', status: 'processing' },
    { label: 'Shipped',    count: orderStats?.shipped,    icon: <CarOutlined />,          color: '#0ea5e9', bg: '#e0f2fe', status: 'shipped' },
    { label: 'Delivered',  count: orderStats?.delivered,  icon: <CheckCircleOutlined />,  color: '#22c55e', bg: '#dcfce7', status: 'delivered' },
    { label: 'Cancelled',  count: orderStats?.cancelled,  icon: <WarningOutlined />,      color: '#ef4444', bg: '#fee2e2', status: 'cancelled' },
  ]

  return (
    <div className="fade-in">
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Dashboard
          </Title>
          <Text style={{ color: '#64748b', fontSize: 14 }}>
            Welcome back! Here's what's happening with your store.
          </Text>
        </div>
        <Space>
          <Link to="/admin/products">
            <Button icon={<ShoppingOutlined />}>View Products</Button>
          </Link>
          <Link to="/admin/orders">
            <Button type="primary" icon={<RightOutlined />}>All Orders</Button>
          </Link>
        </Space>
      </div>

      {/* ── KPI Cards ── */}
      <Row gutter={[18, 18]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Revenue"
            value={orderStats?.total_revenue}
            prefix={<DollarOutlined />}
            precision={2}
            color="#22c55e"
            bgColor="#dcfce7"
            icon={<DollarOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Orders"
            value={orderStats?.total_orders}
            prefix={<ShoppingOutlined />}
            color="#f97316"
            bgColor="#ffedd5"
            icon={<ShoppingOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Users"
            value={userStats?.active_users}
            prefix={<UserOutlined />}
            color="#0ea5e9"
            bgColor="#e0f2fe"
            icon={<UserOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Low Stock Items"
            value={inventoryStats?.low_stock}
            prefix={<InboxOutlined />}
            color={(inventoryStats?.low_stock ?? 0) > 0 ? '#ef4444' : '#22c55e'}
            bgColor={(inventoryStats?.low_stock ?? 0) > 0 ? '#fee2e2' : '#dcfce7'}
            icon={<InboxOutlined />}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[18, 18]} style={{ marginBottom: 24 }}>
        {/* ── Today's Performance ── */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontWeight: 700, fontSize: 15 }}>Today's Performance</span>}
            bordered={false}
            className="stats-card"
            extra={<Tag color="green">Live</Tag>}
          >
            {loading ? <Skeleton active /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748b' }}>Today's Revenue</Text>
                    <Text strong style={{ color: '#22c55e' }}>${Number(orderStats?.today_revenue ?? 0).toFixed(2)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748b' }}>New Orders Today</Text>
                    <Text strong style={{ color: '#f97316' }}>{orderStats?.today_orders ?? 0}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748b' }}>New Users Today</Text>
                    <Text strong style={{ color: '#0ea5e9' }}>{userStats?.new_today ?? 0}</Text>
                  </div>
                </div>

                <Divider style={{ margin: 0 }} />

                <div>
                  <Text style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 10 }}>Order Completion Rate</Text>
                  <Progress
                    percent={deliveredPct}
                    strokeColor={{ from: '#f97316', to: '#22c55e' }}
                    format={(pct) => <Text strong style={{ fontSize: 13 }}>{pct}%</Text>}
                  />
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                    {orderStats?.delivered ?? 0} of {totalOrders} orders delivered
                  </Text>
                </div>

                <div>
                  <Text style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 10 }}>Cancellation Rate</Text>
                  <Progress
                    percent={cancelledPct}
                    strokeColor="#ef4444"
                    trailColor="#fee2e2"
                    format={(pct) => <Text strong style={{ fontSize: 13, color: '#ef4444' }}>{pct}%</Text>}
                  />
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* ── User Statistics ── */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontWeight: 700, fontSize: 15 }}>User Overview</span>}
            bordered={false}
            className="stats-card"
            extra={<Link to="/admin/users"><Button type="link" size="small" style={{ padding: 0, fontSize: 13 }}>View All</Button></Link>}
          >
            {loading ? <Skeleton active /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Total Users',    value: userStats?.total_users,     color: '#f97316', icon: '👥' },
                  { label: 'Customers',      value: userStats?.total_customers,  color: '#0ea5e9', icon: '🛒' },
                  { label: 'Admins',         value: userStats?.total_admins,     color: '#8b5cf6', icon: '🔧' },
                  { label: 'New This Month', value: userStats?.new_this_month,   color: '#22c55e', icon: '✨' },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: '#f8fafc', borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <Text style={{ fontSize: 13.5, color: '#475569' }}>{label}</Text>
                    </div>
                    <Text strong style={{ color, fontSize: 16 }}>{value ?? 0}</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* ── Inventory Health ── */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontWeight: 700, fontSize: 15 }}>Inventory Health</span>}
            bordered={false}
            className="stats-card"
            extra={<Link to="/admin/inventory"><Button type="link" size="small" style={{ padding: 0, fontSize: 13 }}>Manage</Button></Link>}
          >
            {loading ? <Skeleton active /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                  borderRadius: 12, padding: '16px',
                  border: '1px solid #fed7aa',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, color: '#64748b' }}>Total Products</Text>
                    <Text strong style={{ color: '#f97316', fontSize: 18 }}>{inventoryStats?.total_products ?? 0}</Text>
                  </div>
                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                    {inventoryStats?.active_products ?? 0} active
                  </Text>
                </div>

                {[
                  { label: 'Out of Stock', value: inventoryStats?.out_of_stock, color: '#ef4444', bg: '#fee2e2', warn: true },
                  { label: 'Low Stock',    value: inventoryStats?.low_stock,    color: '#f59e0b', bg: '#fef3c7', warn: true },
                  { label: 'Variants OOS', value: inventoryStats?.variants_out_of_stock, color: '#8b5cf6', bg: '#ede9fe', warn: false },
                ].map(({ label, value, color, bg, warn }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8,
                    background: (value ?? 0) > 0 && warn ? bg : '#f8fafc',
                  }}>
                    <Text style={{ fontSize: 13, color: '#475569' }}>
                      {warn && (value ?? 0) > 0 && <WarningOutlined style={{ marginRight: 6, color }} />}
                      {label}
                    </Text>
                    <Text strong style={{ color: (value ?? 0) > 0 ? color : '#22c55e', fontSize: 15 }}>
                      {value ?? 0}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Order Status Breakdown ── */}
      <Card
        title={<span style={{ fontWeight: 700, fontSize: 15 }}>Order Status Breakdown</span>}
        bordered={false}
        className="stats-card"
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', padding: '3px 10px', borderRadius: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-ring 2s ease infinite' }} />
            <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{activeOrders} Active</Text>
          </div>
        }
      >
        {loading ? <Skeleton active /> : (
          <Row gutter={[12, 12]}>
            {ORDER_STATUSES.map(({ label, count, icon, color, bg }) => (
              <Col xs={12} sm={8} md={4} key={label}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px 12px', background: bg, borderRadius: 12,
                  border: `1px solid ${color}22`, textAlign: 'center',
                  transition: 'transform 0.15s',
                }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = '')}
                >
                  <span style={{ fontSize: 20, color, marginBottom: 6 }}>{icon}</span>
                  <Text strong style={{ fontSize: 22, color: '#0f172a', lineHeight: 1.1, display: 'block' }}>
                    {count ?? 0}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</Text>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  )
}
