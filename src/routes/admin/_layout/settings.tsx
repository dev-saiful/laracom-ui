import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  User, Lock, ShieldCheck, Mail, Phone, Calendar,
} from 'lucide-react'
import dayjs from 'dayjs'

export const Route = createFileRoute('/admin/_layout/settings')({
  component: AdminSettingsPage,
})

/* ─── Schemas ───────────────────────────────────────────────────────────────── */

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'New password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords do not match',
  })
type PasswordValues = z.infer<typeof passwordSchema>

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const { user, setUser } = useAuthStore()

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  })

  /* profile update */
  const updateProfile = useMutation({
    mutationFn: (v: ProfileValues) =>
      authApi.updateProfile({ name: v.name, phone: v.phone }),
    onSuccess: (res) => {
      setUser(res.data.data!)
      toast.success('Profile updated')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update profile')),
  })

  /* password change */
  const changePassword = useMutation({
    mutationFn: (v: PasswordValues) =>
      authApi.updateProfile({
        current_password: v.current_password,
        password: v.password,
        password_confirmation: v.password_confirmation,
      }),
    onSuccess: () => {
      toast.success('Password changed successfully')
      passwordForm.reset()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to change password')),
  })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your administrator profile and security.</p>
      </div>

      {/* ── Admin identity card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg shadow-indigo-500/30">
          {user?.name?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-bold text-slate-900 truncate">{user?.name}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3 h-3" /> Administrator
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user?.email}</span>
            {user?.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{user.phone}</span>}
            {user?.created_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since {dayjs(user.created_at).format('MMM YYYY')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile form ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          <h2 className="font-bold text-slate-800">Profile Information</h2>
        </div>
        <form
          onSubmit={profileForm.handleSubmit((v) => updateProfile.mutate(v))}
          className="px-6 py-5 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name" className="font-semibold text-[13px]">Full Name</Label>
              <Input
                id="admin-name"
                placeholder="Your full name"
                {...profileForm.register('name')}
                className={profileForm.formState.errors.name ? 'border-red-400' : ''}
              />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-red-500">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-phone" className="font-semibold text-[13px]">Phone Number</Label>
              <Input
                id="admin-phone"
                placeholder="+880 1700 000000"
                {...profileForm.register('phone')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-[13px]">Email Address</Label>
            <Input value={user?.email ?? ''} disabled className="bg-slate-50 text-slate-400 cursor-not-allowed" />
            <p className="text-xs text-slate-400">Email cannot be changed. Contact a super-admin if needed.</p>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={updateProfile.isPending} className="min-w-[130px]">
              {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Password form ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-500" />
          <h2 className="font-bold text-slate-800">Change Password</h2>
        </div>
        <form
          onSubmit={passwordForm.handleSubmit((v) => changePassword.mutate(v))}
          className="px-6 py-5 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="cur-pass" className="font-semibold text-[13px]">Current Password</Label>
            <Input
              id="cur-pass"
              type="password"
              placeholder="Enter current password"
              autoComplete="current-password"
              {...passwordForm.register('current_password')}
              className={passwordForm.formState.errors.current_password ? 'border-red-400' : ''}
            />
            {passwordForm.formState.errors.current_password && (
              <p className="text-xs text-red-500">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-pass" className="font-semibold text-[13px]">New Password</Label>
              <Input
                id="new-pass"
                type="password"
                placeholder="Min 8 characters"
                autoComplete="new-password"
                {...passwordForm.register('password')}
                className={passwordForm.formState.errors.password ? 'border-red-400' : ''}
              />
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-red-500">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pass" className="font-semibold text-[13px]">Confirm New Password</Label>
              <Input
                id="confirm-pass"
                type="password"
                placeholder="Repeat new password"
                autoComplete="new-password"
                {...passwordForm.register('password_confirmation')}
                className={passwordForm.formState.errors.password_confirmation ? 'border-red-400' : ''}
              />
              {passwordForm.formState.errors.password_confirmation && (
                <p className="text-xs text-red-500">{passwordForm.formState.errors.password_confirmation.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" variant="destructive" disabled={changePassword.isPending} className="min-w-[160px]">
              {changePassword.isPending ? 'Changing…' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
