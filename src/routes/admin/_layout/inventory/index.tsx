import { createFileRoute } from '@tanstack/react-router'
import { Table, Button, Typography, Checkbox, Space, Card } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { App } from 'antd'
import type { Product, ProductVariant } from '@/types'
import { useState } from 'react'

const { Title, Text } = Typography

export const Route = createFileRoute('/admin/_layout/inventory/')({
  component: AdminInventoryPage,
})

function AdminInventoryPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['admin', 'inventory', lowStockOnly, page],
    queryFn: () => adminApi.inventory.list({ low_stock: lowStockOnly, page }).then((r) => r.data),
  })

  // Adjust Stock Mutation
  const adjustMutation = useMutation({
    mutationFn: ({ id, type, adjustment }: { id: string; type: 'product' | 'variant'; adjustment: number }) =>
      adminApi.inventory.adjust(id, { type, adjustment }),
    onMutate: ({ id }) => setMutatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
      message.success('Stock updated')
    },
    onError: () => message.error('Failed to update stock'),
    onSettled: () => setMutatingId(null),
  })

  const handleAdjust = (id: string, type: 'product' | 'variant', amount: number) => {
      adjustMutation.mutate({ id, type, adjustment: amount })
  }

  const columns = [
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, record: Product) => (
        <div>
          <Text strong>{record.name}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {record.variants && record.variants.length > 0 ? `${record.variants.length} Variants` : 'Single Product'}
          </div>
        </div>
      ),
    },
    {
      title: 'Current Stock',
      key: 'stock',
      render: (_: unknown, record: Product) => {
         if (record.variants && record.variants.length > 0) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {record.variants.map((v: ProductVariant) => (
                        <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 240, fontSize: 12 }}>
                            <span style={{ flex: 1 }}>{v.name}:</span>
                            <Space size={8}>
                                <Text strong style={{ minWidth: 24, textAlign: 'center' }}>{v.stock}</Text>
                                <Button 
                                  size="small" 
                                  onClick={() => handleAdjust(v.id, 'variant', 1)}
                                  loading={mutatingId === v.id && adjustMutation.isPending}
                                >+</Button>
                                <Button 
                                  size="small" 
                                  onClick={() => handleAdjust(v.id, 'variant', -1)}
                                  loading={mutatingId === v.id && adjustMutation.isPending}
                                >-</Button>
                            </Space>
                        </div>
                    ))}
                </div>
            )
        }
        return (
            <Space size={16}>
                <Text strong style={{ fontSize: 16 }}>{record.stock}</Text>
                <Button 
                  size="small" 
                  onClick={() => handleAdjust(record.id, 'product', 1)}
                  loading={mutatingId === record.id && adjustMutation.isPending}
                >+</Button>
                <Button 
                  size="small" 
                  onClick={() => handleAdjust(record.id, 'product', -1)}
                  loading={mutatingId === record.id && adjustMutation.isPending}
                >-</Button>
            </Space>
        )
      },
    },
  ]

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Inventory Management</Title>

      <div style={{ marginBottom: 24 }}>
        <Checkbox checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)}>
            Show Low Stock Only
        </Checkbox>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          dataSource={inventoryData?.data || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
              total: inventoryData?.meta?.total,
              pageSize: inventoryData?.meta?.per_page,
              current: page,
              showSizeChanger: false,
              onChange: (p) => setPage(p),
          }}
        />
      </Card>
    </div>
  )
}
