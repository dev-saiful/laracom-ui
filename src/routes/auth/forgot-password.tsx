import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { getErrorMessage } from '@/lib/error'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react'

const schema = z.object({ email: z.string().email('Enter a valid email address') })
type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/auth/forgot-password')({ component: ForgotPasswordPage })

function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authApi.forgotPassword(values.email),
    onSuccess: () => setSubmitted(true),
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to send reset email')),
  })

  const AuthWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-violet-700 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {children}
      </div>
    </div>
  )

  if (submitted) {
    return (
      <AuthWrapper>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
          <p className="text-slate-500 text-sm">
            We've sent a password reset link to <strong className="text-slate-700">{email}</strong>. The link expires in 60 minutes.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/auth/login">
              <Button className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Login</Button>
            </Link>
            <Button variant="ghost" onClick={() => setSubmitted(false)} className="w-full">Try another email</Button>
          </div>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper>
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="h-7 w-7 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Forgot Password</h1>
        <p className="text-slate-500 text-sm">Enter your email and we'll send you a reset link</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit((values) => { setError(''); setEmail(values.email); mutation.mutate(values) })} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-semibold text-[13.5px]">Email Address</Label>
          <Input
            id="email" type="email" placeholder="your@email.com"
            {...register('email')}
            className={errors.email ? 'border-red-400' : ''}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="text-center mt-5">
        <Link to="/auth/login" className="text-sm text-indigo-600 font-medium no-underline hover:underline flex items-center justify-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </Link>
      </div>
    </AuthWrapper>
  )
}
