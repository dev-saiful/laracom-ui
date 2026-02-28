import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { User, Lock, ShoppingBag, Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { ordersApi } from '@/api/orders'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error'
import type { Order, OrderStatus } from '@/types'
import dayjs from 'dayjs'
import OrderStatusBadge from '@/components/shared/OrderStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/account')({
  component: AccountPage,
})

interface ProfileValues { name: string; phone?: string }
interface PasswordValues { current_password: string; password: string; password_confirmation: string }

function AccountPage() {
  const queryClient = useQueryClient()
  const { user, setAuth, isAuthenticated } = useAuthStore()

  const profileForm = useForm<ProfileValues>({ defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' } })
  const passwordForm = useForm<PasswordValues>()

  const { data: ordersResp } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.history().then((r) => r.data),
    enabled: isAuthenticated,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileValues) => authApi.updateProfile({ name: values.name, phone: values.phone }),
    onSuccess: (res) => {
      const stored = useAuthStore.getState()
      setAuth(res.data.data!, stored.accessToken!, stored.refreshToken!)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated successfully')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update profile')),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (values: PasswordValues) => authApi.updateProfile({
      current_password: values.current_password,
      password: values.password,
      password_confirmation: values.password_confirmation,
    }),
    onSuccess: () => {
      toast.success('Password changed successfully')
      passwordForm.reset()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to change password')),
  })

  if (!isAuthenticated) {
    return (
      <div className="page-container section-gap text-center py-20">
        <p className="text-slate-500 mb-4">Please log in to view your account</p>
        <Link to="/auth/login"><Button>Sign In</Button></Link>
      </div>
    )
  }

  const orders = ordersResp?.data ?? []

  return (
    <div className="page-container section-gap">
      <h2 className="text-2xl font-bold mb-8">My Account</h2>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <Tabs defaultValue="profile">
          <TabsList className="mb-8">
            <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" />Profile</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Lock className="w-4 h-4" />Security</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />My Orders ({orders.length})
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{user?.name}</h3>
                <p className="text-slate-400 text-sm">{user?.email}</p>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block capitalize',
                  user?.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>
                  {user?.role}
                </span>
              </div>
            </div>
            <hr className="border-slate-100 mb-6" />
            <h4 className="font-bold mb-5">Update Profile</h4>
            <form onSubmit={profileForm.handleSubmit((v) => updateProfileMutation.mutate(v))} className="max-w-sm space-y-4">
              <div>
                <Label htmlFor="pname">Full Name</Label>
                <Input id="pname" className="mt-1" {...profileForm.register('name', { required: true })} />
              </div>
              <div>
                <Label htmlFor="pphone">Phone Number</Label>
                <Input id="pphone" className="mt-1" placeholder="+1 234 567 8900" {...profileForm.register('phone')} />
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <h4 className="font-bold mb-5">Change Password</h4>
            <form onSubmit={passwordForm.handleSubmit((v) => changePasswordMutation.mutate(v))} className="max-w-sm space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input type="password" className="mt-1"
                  {...passwordForm.register('current_password', { required: true })} />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" className="mt-1"
                  {...passwordForm.register('password', { required: true, minLength: 8 })} />
                {passwordForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">Must be at least 8 characters</p>
                )}
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" className="mt-1"
                  {...passwordForm.register('password_confirmation', {
                    required: true,
                    validate: (v) => v === passwordForm.watch('password') || 'Passwords do not match',
                  })} />
                {passwordForm.formState.errors.password_confirmation && (
                  <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.password_confirmation.message}</p>
                )}
              </div>
              <Button type="submit" variant="destructive" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                      <th className="text-left py-3 pr-4 font-semibold">Order #</th>
                      <th className="text-left py-3 pr-4 font-semibold">Date</th>
                      <th className="text-left py-3 pr-4 font-semibold">Status</th>
                      <th className="text-left py-3 pr-4 font-semibold">Total</th>
                      <th className="py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order: Order) => (
                      <tr key={order.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-4 pr-4">
                          <Link to="/orders/$id" params={{ id: order.id }} search={{ success: undefined }}
                            className="text-indigo-600 font-semibold hover:underline">
                            #{order.order_number}
                          </Link>
                        </td>
                        <td className="py-4 pr-4 text-slate-500">{dayjs(order.created_at).format('MMM D, YYYY')}</td>
                        <td className="py-4 pr-4"><OrderStatusBadge status={order.status as OrderStatus} /></td>
                        <td className="py-4 pr-4 font-semibold">৳{order.total?.toFixed(2)}</td>
                        <td className="py-4">
                          <Link to="/orders/$id" params={{ id: order.id }} search={{ success: undefined }}>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
