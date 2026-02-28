import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
    email: (search.email as string) || '',
  }),
  component: ResetPasswordPage,
})

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})
type FormValues = z.infer<typeof schema>

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token, email } = Route.useSearch()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email, token },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      authApi.resetPassword({
        email: values.email,
        token: values.token,
        password: values.password,
        password_confirmation: values.password_confirmation,
      }),
    onSuccess: () => {
      toast.success('Password reset successfully! Please log in.')
      navigate({ to: '/auth/login' })
    },
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to reset password')),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-violet-700 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset Password</h1>
          <p className="text-slate-500 text-sm">Enter your new password below</p>
        </div>

        {!token && (
          <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
            <AlertDescription>No reset token found. Please use the link from your email or enter it below.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit((values) => { setError(''); mutation.mutate(values) })} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-semibold text-[13.5px]">Email</Label>
            <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-red-400' : ''} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {!token && (
            <div className="space-y-1.5">
              <Label htmlFor="token" className="font-semibold text-[13.5px]">Reset Token</Label>
              <Input id="token" placeholder="Paste token from email" {...register('token')} className={errors.token ? 'border-red-400' : ''} />
              {errors.token && <p className="text-xs text-red-500">{errors.token.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-semibold text-[13.5px]">New Password</Label>
            <Input id="password" type="password" placeholder="Min. 8 characters" {...register('password')} className={errors.password ? 'border-red-400' : ''} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password_confirmation" className="font-semibold text-[13.5px]">Confirm Password</Label>
            <Input id="password_confirmation" type="password" placeholder="Repeat password" {...register('password_confirmation')} className={errors.password_confirmation ? 'border-red-400' : ''} />
            {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Resetting…' : 'Reset Password'}
          </Button>
        </form>

        <div className="text-center mt-5">
          <Link to="/auth/login" className="text-sm text-indigo-600 font-medium no-underline hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
