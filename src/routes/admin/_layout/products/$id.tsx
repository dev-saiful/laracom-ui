import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import {
  Form, Input, Button, InputNumber, Switch, Select, Card,
  Typography, Space, Upload, Row, Col, Alert
} from 'antd'
import { PlusOutlined, ArrowLeftOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { categoriesApi } from '@/api/products'
import { App } from 'antd'
import { getErrorMessage } from '@/lib/error'
import { useEffect } from 'react'

const { Title } = Typography
const { TextArea } = Input

export const Route = createFileRoute('/admin/_layout/products/$id')({
  component: ProductFormPage,
})

function ProductFormPage() {
  const { id } = Route.useParams()
  const isEdit = id !== 'new'
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data.data),
  })

  // Fetch Product (if edit)
  const { data: productResp, isLoading } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => adminApi.products.show(id).then((r) => r.data),
    enabled: isEdit,
  })
  const product = productResp?.data

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        ...product,
        category_id: product.category?.id,
        variants: product.variants ?? [],
      })
    }
  }, [product, form])

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      // Clean up values
      const payload = { ...values }
      // Filter out empty variant rows
      if (Array.isArray(payload.variants)) {
        payload.variants = payload.variants.filter((v: Record<string, unknown>) => v && v.name)
      }
      
      // Since we don't have a real image upload backend logic prepared in this UI demo,
      // we'll preserve existing images or use placeholders if new.
      // In a real app, we'd upload files first and send URLs/IDs.
      if (!payload.images || payload.images.length === 0) {
        payload.images = [
            `https://placehold.co/600x600/f1f5f9/94a3b8?text=${encodeURIComponent(payload.name)}`,
            `https://placehold.co/600x600/e2e8f0/94a3b8?text=${encodeURIComponent(payload.name)}+2`,
        ]
      }
      
      return isEdit 
        ? adminApi.products.update(id, payload) 
        : adminApi.products.store(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      message.success('Product saved successfully')
      navigate({ to: '/admin/products' })
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err, 'Failed to save product'))
    },
  })

  if (isEdit && isLoading) return <div className="page-container section-gap">Loading...</div>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Link to="/admin/products">
            <Button icon={<ArrowLeftOutlined />}>Back</Button>
        </Link>
        <Title level={2} style={{ margin: 0 }}>
            {isEdit ? 'Edit Product' : 'New Product'}
        </Title>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => saveMutation.mutate(values)}
        initialValues={{ is_active: true, is_featured: false, stock: 0, price: 0 }}
      >
        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
            <Title level={4}>Basic Information</Title>
            
            <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                <Input size="large" />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
                        <Select placeholder="Select Category">
                            {categories?.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="stock" label="Stock Quantity" rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="price" label="Price" rules={[{ required: true }]}>
                        <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="compare_price" label="Compare Price">
                         <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>

             <Form.Item name="short_description" label="Short Description" rules={[{ required: true }]}>
                <TextArea rows={2} showCount maxLength={255} />
            </Form.Item>

            <Form.Item name="description" label="Detailed Description">
                <TextArea rows={6} />
            </Form.Item>
        </Card>

        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
             <Title level={4}>Status & Visibility</Title>
             <Space size={24}>
                <Form.Item name="is_active" label="Active" valuePropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item name="is_featured" label="Featured" valuePropName="checked">
                    <Switch />
                </Form.Item>
             </Space>
        </Card>

        {/* Variants */}
        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
          <Title level={4}>Variants</Title>
          <Form.List name="variants">
            {(fields, { add, remove }) => (
              <>
                {fields.length > 0 && (
                  <Row gutter={8} style={{ fontWeight: 600, marginBottom: 4, padding: '0 4px' }}>
                    <Col span={7}><span style={{ fontSize: 12, color: '#64748b' }}>Name</span></Col>
                    <Col span={5}><span style={{ fontSize: 12, color: '#64748b' }}>Price ($)</span></Col>
                    <Col span={5}><span style={{ fontSize: 12, color: '#64748b' }}>Stock</span></Col>
                    <Col span={5}><span style={{ fontSize: 12, color: '#64748b' }}>SKU</span></Col>
                    <Col span={2} />
                  </Row>
                )}
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={7}>
                      <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Name required' }]} style={{ margin: 0 }}>
                        <Input placeholder="e.g. Red / XL" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: 'Price required' }]} style={{ margin: 0 }}>
                        <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item {...restField} name={[name, 'stock']} style={{ margin: 0 }}>
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item {...restField} name={[name, 'sku']} style={{ margin: 0 }}>
                        <Input placeholder="SKU-001" />
                      </Form.Item>
                    </Col>
                    <Col span={2} style={{ textAlign: 'center' }}>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                        size="small"
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ stock: 0, price: 0 })}
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                >
                  Add Variant
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* Image Upload Placeholder - in real app would use Upload component with action URL */}
        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24 }}>
            <Title level={4}>Images</Title>
            <Alert message="Image upload is simulated in this demo. Default placeholders will be used." type="info" showIcon style={{ marginBottom: 16 }} />
            <Upload listType="picture-card" disabled>
                 <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                </div>
            </Upload>
        </Card>

        <div style={{ textAlign: 'right', marginBottom: 40 }}>
             <Button size="large" onClick={() => navigate({ to: '/admin/products' })} style={{ marginRight: 16 }}>
                Cancel
             </Button>
             <Button type="primary" htmlType="submit" size="large" loading={saveMutation.isPending}>
                Save Product
             </Button>
        </div>
      </Form>
    </div>
  )
}
