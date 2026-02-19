import { createFileRoute } from '@tanstack/react-router'
import { Table, Tag, Switch, Button, Avatar, Typography, Space, Card } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { App } from 'antd'
import type { User } from '@/types'
import { useState } from 'react'

const { Title, Text } = Typography

export const Route = createFileRoute('/admin/_layout/users/')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => adminApi.users.list({ page }).then((r) => r.data),
  })

  // Mutations
  const toggleActive = useMutation({
    mutationFn: (id: string) => adminApi.users.toggleActive(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      message.success('User status updated')
    },
    onSettled: () => setMutatingId(null),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.users.updateRole(id, role),
    onMutate: ({ id }) => setMutatingId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      message.success('User role updated')
    },
    onSettled: () => setMutatingId(null),
  })

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: User) => (
        <Space>
          <Avatar style={{ backgroundColor: '#f97316' }}>{record.name[0]}</Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => {
        const toggleRole = () => updateRole.mutate({ id: record.id, role: role === 'admin' ? 'customer' : 'admin' })
        return (
          <Space>
            <Tag color={role === 'admin' ? 'purple' : 'blue'}>{role.toUpperCase()}</Tag>
            <Button 
              size="small" 
              type="link" 
              onClick={toggleRole} 
              loading={mutatingId === record.id && updateRole.isPending}
            >
              Change
            </Button>
          </Space>
        )
      },
    },
    {
      title: 'Active',
      width: 100,
      render: (_: unknown, record: User) => (
        <Switch 
          checked={record.is_active} 
          loading={mutatingId === record.id && toggleActive.isPending}
          onChange={() => toggleActive.mutate(record.id)} 
        />
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
      render: (val: string) => val || '-',
    },
  ]

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Users</Title>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          dataSource={usersData?.data || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
              total: usersData?.meta?.total,
              pageSize: usersData?.meta?.per_page,
              current: page,
              showSizeChanger: false,
              onChange: (p) => setPage(p),
          }}
        />
      </Card>
    </div>
  )
}
