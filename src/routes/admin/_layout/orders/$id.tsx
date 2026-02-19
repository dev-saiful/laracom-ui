import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Card, Row, Col, Typography, Space, Button, Steps, Tag,
  Select, Input, Form, Modal, Descriptions, Table, Divider, Skeleton
} from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { getErrorMessage } from '@/lib/error'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import { App } from 'antd'
import { useState } from 'react'
import dayjs from 'dayjs'
import type { OrderStatus, OrderItem } from '@/types'

const { Title, Text } = Typography

export const Route = createFileRoute('/admin/_layout/orders/$id')({
  component: AdminOrderDetailPage,
})

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
]

function AdminOrderDetailPage() {
  const { id } = Route.useParams()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [form] = Form.useForm()

  const { data: orderResp, isLoading } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => adminApi.orders.show(id).then((r) => r.data),
  })
  const order = orderResp?.data

  const updateStatus = useMutation({
    mutationFn: (values: { status: string; tracking_number?: string }) =>
      adminApi.orders.updateStatus(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      message.success('Order status updated')
      setStatusModalOpen(false)
    },
    onError: (err: unknown) => message.error(getErrorMessage(err, 'Failed to update status')),
  })

  if (isLoading) return (
    <Card style={{ margin: 24 }}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </Card>
  )
  if (!order) return <div style={{ padding: 40 }}>Order not found</div>

  const stepIndex = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 }
  const currentStep = stepIndex[order.status as keyof typeof stepIndex] ?? -1

  const itemColumns = [
    { title: 'Product', dataIndex: 'product_name', key: 'name',
      render: (name: string, row: OrderItem) => (
        <div>
          <Text strong>{name}</Text>
          {row.variant_name && <div><Text type="secondary" style={{ fontSize: 12 }}>{row.variant_name}</Text></div>}
          {row.sku && <div><Text type="secondary" style={{ fontSize: 11 }}>SKU: {row.sku}</Text></div>}
        </div>
      )
    },
    { title: 'Qty', dataIndex: 'quantity', key: 'qty', width: 70 },
    { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price',
      render: (v: number) => `$${Number(v).toFixed(2)}`, width: 110 },
    { title: 'Total', dataIndex: 'total_price', key: 'total',
      render: (v: number) => <Text strong>${Number(v).toFixed(2)}</Text>, width: 110 },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Link to="/admin/orders">
          <Button icon={<ArrowLeftOutlined />}>Back to Orders</Button>
        </Link>
        <Title level={3} style={{ margin: 0 }}>Order #{order.order_number}</Title>
        <OrderStatusBadge status={order.status} />
        <Button icon={<EditOutlined />} type="primary" onClick={() => {
          form.setFieldsValue({ status: order.status, tracking_number: order.tracking_number })
          setStatusModalOpen(true)
        }}>
          Update Status
        </Button>
      </Space>

      {/* Progress */}
      {currentStep >= 0 && (
        <Card bordered={false} style={{ marginBottom: 24, borderRadius: 12 }}>
          <Steps
            current={currentStep}
            items={[
              { title: 'Pending' }, { title: 'Confirmed' }, { title: 'Processing' },
              { title: 'Shipped' }, { title: 'Delivered' },
            ]}
          />
        </Card>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {/* Items */}
          <Card title="Order Items" bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
            <Table
              dataSource={order.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right"><Text strong>Subtotal</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><Text strong>${Number(order.subtotal).toFixed(2)}</Text></Table.Summary.Cell>
                  </Table.Summary.Row>
                  {order.shipping_cost > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right"><Text>Shipping</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>${Number(order.shipping_cost).toFixed(2)}</Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {order.discount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right"><Text type="success">Discount</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}><Text type="success">-${Number(order.discount).toFixed(2)}</Text></Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right"><Title level={5} style={{ margin: 0 }}>Total</Title></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><Title level={5} style={{ margin: 0, color: '#f97316' }}>${Number(order.total).toFixed(2)}</Title></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Order Info */}
          <Card title="Order Details" bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Order Date">
                {dayjs(order.created_at).format('MMM D, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {order.payment_method || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={order.payment_status === 'paid' ? 'green' : 'orange'}>
                  {order.payment_status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              {order.tracking_number && (
                <Descriptions.Item label="Tracking No.">
                  <Text copyable>{order.tracking_number}</Text>
                </Descriptions.Item>
              )}
              {order.notes && (
                <Descriptions.Item label="Notes">{order.notes}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Customer / Shipping */}
          <Card title="Shipping Address" bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
            <Text strong style={{ display: 'block' }}>{order.shipping_address.name}</Text>
            <Text type="secondary">{order.shipping_address.address}</Text><br />
            <Text type="secondary">{order.shipping_address.city}, {order.shipping_address.country}</Text><br />
            <Text type="secondary">{order.shipping_address.phone}</Text>
            {order.guest_email && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary">Guest: {order.guest_email}</Text>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Update Status Modal */}
      <Modal
        title="Update Order Status"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={() => form.submit()}
        okText="Update"
        confirmLoading={updateStatus.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => updateStatus.mutate(v)}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={ORDER_STATUSES.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))} />
          </Form.Item>
          <Form.Item name="tracking_number" label="Tracking Number">
            <Input placeholder="e.g. 1Z999AA10123456784" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
