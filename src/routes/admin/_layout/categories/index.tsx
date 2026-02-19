import { createFileRoute } from '@tanstack/react-router'
import {
  Table, Button, Space, Tag, Typography, Avatar, Form, Input, Switch,
  Select, Modal, Popconfirm, Row, Col, Card, InputNumber
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { App } from 'antd'
import { getErrorMessage } from '@/lib/error'
import { useState } from 'react'
import type { Category } from '@/types'

const { Title, Text } = Typography

export const Route = createFileRoute('/admin/_layout/categories/')({
  component: AdminCategoriesPage,
})

function AdminCategoriesPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { data: resp, isLoading } = useQuery({
    queryKey: ['admin', 'categories', search],
    queryFn: () => adminApi.categories.list({ search: search || undefined, per_page: 50 }).then((r) => r.data),
  })

  // Top-level categories for parent selector
  const { data: rootResp } = useQuery({
    queryKey: ['admin', 'categories', 'root'],
    queryFn: () => adminApi.categories.list({ root_only: true, per_page: 100 }).then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (values: Partial<Category>) =>
      editingCategory
        ? adminApi.categories.update(editingCategory.id, values)
        : adminApi.categories.store(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      message.success(editingCategory ? 'Category updated' : 'Category created')
      setModalOpen(false)
      form.resetFields()
      setEditingCategory(null)
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err, 'Failed to save category'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.categories.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      message.success('Category deleted')
    },
    onError: (err: unknown) => {
      message.error(getErrorMessage(err, 'Cannot delete category'))
    },
  })

  const openNew = () => {
    setEditingCategory(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true, sort_order: 0 })
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    form.setFieldsValue({
      name: cat.name,
      description: cat.description,
      parent_id: cat.parent_id ?? cat.parent?.id ?? null,
      image: cat.image,
      is_active: cat.is_active ?? true,
      sort_order: cat.sort_order ?? 0,
    })
    setModalOpen(true)
  }

  const columns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => (
        <Space>
          {record.image
            ? <Avatar shape="square" src={record.image} size={36} />
            : <Avatar shape="square" icon={<FolderOutlined />} size={36} style={{ backgroundColor: '#f97316' }} />
          }
          <div>
            <Text strong>{name}</Text>
            {record.parent && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>↳ {record.parent.name}</Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      responsive: ['md'],
      render: (slug: string) => <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>{slug}</Text>,
    },
    {
      title: 'Products',
      dataIndex: 'products_count',
      key: 'products_count',
      align: 'center' as const,
      responsive: ['sm'],
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>{count ?? 0}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center' as const,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Sort',
      dataIndex: 'sort_order',
      key: 'sort_order',
      align: 'center' as const,
      render: (order: number) => <Text type="secondary">{order ?? 0}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: Category) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title={`Delete "${record.name}"?`}
            description="This cannot be undone. Products assigned to this category will lose it."
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Categories</Title>
          <Text type="secondary">{resp?.meta?.total ?? 0} total categories</Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
            New Category
          </Button>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search categories..."
            allowClear
            style={{ width: 300 }}
            onSearch={(v) => setSearch(v)}
            onChange={(e) => !e.target.value && setSearch('')}
          />
        </div>

        <Table
          dataSource={resp?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} categories` }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingCategory ? `Edit: ${editingCategory.name}` : 'New Category'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingCategory(null); form.resetFields() }}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
        width="90vw"
        style={{ maxWidth: 520 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. Electronics" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional category description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parent_id" label="Parent Category">
                <Select allowClear placeholder="None (top-level)">
                  {rootResp?.data
                    ?.filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sort_order" label="Sort Order">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="image" label="Image URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
