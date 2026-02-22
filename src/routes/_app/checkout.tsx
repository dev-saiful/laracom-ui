import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Form, Input, Button, Row, Col, Card, Typography, Radio, Steps, Divider, Alert, Checkbox, Space } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { ordersApi } from '@/api/orders'
import { useAuthStore } from '@/store/auth'
import { getErrorMessage } from '@/lib/error'
import { useState } from 'react'
import { App } from 'antd'

const { Title, Text } = Typography

interface CheckoutFormValues {
  name: string
  phone: string
  address: string
  city: string
  country: string
  email?: string
  billing_name?: string
  billing_phone?: string
  billing_address?: string
  billing_city?: string
  billing_country?: string
  payment_method: string
  notes?: string
}

export const Route = createFileRoute('/_app/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [billingSame, setBillingSame] = useState(true)

  // Fetch Cart
  const { data: cartResp, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data),
  })
  const cart = cartResp?.data

  const checkoutMutation = useMutation({
    mutationFn: (values: CheckoutFormValues) => {
      const billing_address = billingSame ? undefined : {
        name: values.billing_name,
        phone: values.billing_phone,
        address: values.billing_address,
        city: values.billing_city,
        country: values.billing_country,
      }
      const payload = {
        shipping_address: {
          name: values.name,
          phone: values.phone,
          address: values.address,
          city: values.city,
          country: values.country,
        },
        billing_address,
        payment_method: values.payment_method,
        notes: values.notes,
      }

      if (isAuthenticated) {
        return ordersApi.checkout(payload)
      } else {
        return ordersApi.guestCheckout({
          ...payload,
          guest_email: values.email,
          guest_phone: values.phone,
          items: cart!.items.map(item => ({
            product_id: item.product.id,
            product_variant_id: item.variant?.id,
            quantity: item.quantity,
          })),
        })
      }
    },
    onSuccess: (res) => {
      // Immediately clear stale cart data — avoids showing old items while refetch is in-flight
      queryClient.removeQueries({ queryKey: ['cart'] })
      queryClient.setQueryData(['cart-count'], 0)
      
      const orderId = res.data.data.id
      const orderNumber = res.data.data.order_number
      
      if (isAuthenticated) {
        // Authenticated users go to order detail page
        navigate({ to: '/orders/$id', params: { id: orderId }, search: { success: 'true' } })
      } else {
        // Guest users go to track page with order number pre-filled
        navigate({ to: '/track', search: { orderNumber, success: 'true' } })
      }
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err, 'Checkout failed. Please try again.'))
    },
  })

  if (cartLoading) return <div className="page-container section-gap">Loading...</div>
  if (!cart || cart.items.length === 0) return <div className="page-container section-gap">Cart is empty</div>

  const onFinish = (values: CheckoutFormValues) => {
    checkoutMutation.mutate(values)
  }

  return (
    <div className="page-container section-gap">
      <Title level={2} style={{ marginBottom: 32 }}>Checkout</Title>

      <Row gutter={32}>
        <Col xs={24} lg={16}>
          <Steps
            current={currentStep}
            items={[{ title: 'Shipping' }, { title: 'Payment' }, { title: 'Review' }]}
            style={{ marginBottom: 40 }}
          />

          <Card bordered={false} style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                name: user?.name,
                email: user?.email,
                phone: user?.phone,
                country: 'Bangladesh',
                payment_method: 'cod',
                billing_same: true,
              }}
            >
              {/* Step 1: Shipping */}
              <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                <Title level={4}>Contact Information</Title>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                      <Input disabled={isAuthenticated} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Title level={4}>Shipping Address</Title>
                <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="address" label="Address" rules={[{ required: true }]}>
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="country" label="Country" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                {/* Billing Address */}
                <Form.Item name="billing_same" valuePropName="checked">
                  <Checkbox
                    checked={billingSame}
                    onChange={(e) => {
                      setBillingSame(e.target.checked)
                      form.setFieldValue('billing_same', e.target.checked)
                    }}
                  >
                    Billing address is the same as shipping address
                  </Checkbox>
                </Form.Item>

                {!billingSame && (
                  <>
                    <Title level={4}>Billing Address</Title>
                    <Form.Item name="billing_name" label="Full Name" rules={[{ required: true, message: 'Billing name required' }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="billing_phone" label="Phone">
                      <Input />
                    </Form.Item>
                    <Form.Item name="billing_address" label="Address" rules={[{ required: true, message: 'Billing address required' }]}>
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="billing_city" label="City" rules={[{ required: true, message: 'Billing city required' }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="billing_country" label="Country" rules={[{ required: true, message: 'Billing country required' }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )}

                <Button type="primary" onClick={() => form.validateFields().then(() => setCurrentStep(1))}>
                  Continue to Payment
                </Button>
              </div>

              {/* Step 2: Payment */}
              <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                <Title level={4}>Payment Method</Title>
                <Form.Item name="payment_method">
                  <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Card size="small" style={{ cursor: 'pointer' }} onClick={() => form.setFieldValue('payment_method', 'cod')}>
                      <Radio value="cod">Cash on Delivery (COD)</Radio>
                    </Card>
                    <Card size="small" style={{ opacity: 0.5 }}>
                      <Radio value="stripe" disabled>Credit Card (Coming Soon)</Radio>
                    </Card>
                  </Radio.Group>
                </Form.Item>
                
                <Space style={{ marginTop: 24 }}>
                  <Button onClick={() => setCurrentStep(0)}>Back</Button>
                  <Button type="primary" onClick={() => setCurrentStep(2)}>Review Order</Button>
                </Space>
              </div>

              {/* Step 3: Review */}
              <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                <Title level={4}>Order Review</Title>
                <Alert
                  message="Please confirm your order details before placing the order."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <div style={{ marginBottom: 24 }}>
                  <Text type="secondary">Shipping to:</Text>
                  <div style={{ fontWeight: 500 }}>
                    {form.getFieldValue('address')}, {form.getFieldValue('city')}
                  </div>
                </div>

                <Space style={{ marginTop: 24 }}>
                  <Button onClick={() => setCurrentStep(1)}>Back</Button>
                  <Button type="primary" htmlType="submit" loading={checkoutMutation.isPending} size="large">
                    Place Order - ${cart.total.toFixed(2)}
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </Col>

        {/* Order Summary Sidebar */}
        <Col xs={24} lg={8}>
          <Card title="Order Summary" bordered={false} style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <img src={item.product.images?.[0]} width={60} height={60} style={{ borderRadius: 8, objectFit: 'cover' }} />
                    <span style={{ 
                      position: 'absolute', top: -8, right: -8, background: '#64748b', color: 'white', 
                      borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', fontSize: 11 
                    }}>
                      {item.quantity}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>{item.product.name}</Text>
                    {item.variant && <Text type="secondary" style={{ fontSize: 12 }}>{item.variant.name}</Text>}
                  </div>
                  <Text>${item.subtotal.toFixed(2)}</Text>
                </div>
              ))}
            </div>
            
            <Divider />
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Subtotal</Text>
                <Text strong>${cart.total.toFixed(2)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Shipping</Text>
                <Text type="secondary">Free</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0 }}>Total</Title>
                <Title level={4} style={{ margin: 0, color: '#6366f1' }}>${cart.total.toFixed(2)}</Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
