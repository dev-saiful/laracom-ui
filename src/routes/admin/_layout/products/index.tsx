import { createFileRoute, Link } from '@tanstack/react-router'
import { Table, Button, Space, Input, Tag, Switch, Popconfirm, Avatar, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { App } from 'antd'
import { useState, useEffect } from 'react'
import type { Product } from '@/types'

const { Title, Text } = Typography

export const Route = createFileRoute('/admin/_layout/products/')({
  component: AdminProductsPage,
})

function AdminProductsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 when search changes
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin', 'products', debouncedSearch, page],
    queryFn: () => adminApi.products.list({ search: debouncedSearch, page }).then((r) => r.data),
  })

  // Mutations
  const toggleActive = useMutation({
    mutationFn: (id: string) => adminApi.products.toggleActive(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      message.success('Status updated')
    },
    onSettled: () => setMutatingId(null),
  })

  const toggleFeatured = useMutation({
    mutationFn: (id: string) => adminApi.products.toggleFeatured(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      message.success('Featured status updated')
    },
    onSettled: () => setMutatingId(null),
  })

  const duplicateProduct = useMutation({
    mutationFn: (id: string) => adminApi.products.duplicate(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      message.success('Product duplicated')
    },
    onSettled: () => setMutatingId(null),
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => adminApi.products.destroy(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      message.success('Product deleted')
    },
    onSettled: () => setMutatingId(null),
  })

  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <Space>
          <Avatar shape="square" size={48} src={record.images?.[0]} />
          <div>
            <Text strong>{text}</Text>
            {record.category && <div style={{ fontSize: 12, color: '#64748b' }}>{record.category.name}</div>}
          </div>
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      responsive: ['md'],
      render: (val: number) => `$${val.toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (val: number) => (
        <Tag color={val > 10 ? 'green' : val > 0 ? 'orange' : 'red'}>
          {val > 0 ? `${val} in stock` : 'Out of stock'}
        </Tag>
      ),
    },
    {
      title: 'Active',
      width: 80,
      responsive: ['sm'],
      render: (_: unknown, record: Product) => (
        <Switch 
          size="small" 
          checked={record.is_active} 
          loading={mutatingId === record.id && toggleActive.isPending}
          onChange={() => toggleActive.mutate(record.id)} 
        />
      ),
    },
    {
      title: 'Featured',
      width: 90,
      responsive: ['lg'],
      render: (_: unknown, record: Product) => (
        <Switch 
          size="small" 
          checked={record.is_featured} 
          loading={mutatingId === record.id && toggleFeatured.isPending}
          onChange={() => toggleFeatured.mutate(record.id)} 
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Product) => (
        <Space>
          <Button 
            type="text" 
            icon={<CopyOutlined />} 
            onClick={() => duplicateProduct.mutate(record.id)}
            loading={mutatingId === record.id && duplicateProduct.isPending}
            title="Duplicate"
          />
          <Link to="/admin/products/$id" params={{ id: record.id }}>
            <Button type="text" icon={<EditOutlined />} />
          </Link>
          <Popconfirm title="Delete product?" onConfirm={() => deleteProduct.mutate(record.id)}>
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              loading={mutatingId === record.id && deleteProduct.isPending} 
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Products</Title>
        <Link to="/admin/products/new">
          <Button type="primary" icon={<PlusOutlined />}>Add Product</Button>
        </Link>
      </div>

      <Input 
        prefix={<SearchOutlined />} 
        placeholder="Search products..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />

      <Table
        dataSource={productsData?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
            total: productsData?.meta?.total,
            pageSize: productsData?.meta?.per_page,
            current: page,
            showSizeChanger: false,
            onChange: (p) => setPage(p),
        }}
        style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}
      />
    </div>
  )
}
