import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { getErrorMessage } from '@/lib/error'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Mail, RefreshCw } from 'lucide-react'

const schema = z.object({ otp: z.string().length(6, 'OTP must be exactly 6 digits') })
type FormValues = z.infer<typeof schema>

interface VerifySearch { email: string }

export const Route = createFileRoute('/auth/verify-otp')({
  component: VerifyOtpPage,
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    email: (search.email as string) || '',
  }),
})

function VerifyOtpPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/auth/verify-otp' })
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const verifyMutation = useMutation({
    mutationFn: (otp: string) => authApi.verifyOtp({ email: search.email, otp }),
    onSuccess: (res) => {
      const { user, access_token, refresh_token } = res.data.data
      setAuth(user, access_token, refresh_token)
      toast.success('Account verified successfully!')
      navigate({ to: '/' })
    },
    onError: (err: unknown) => setError(getErrorMessage(err, 'Invalid or expired OTP')),
  })

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp(search.email),
    onSuccess: () => {
      toast.success('OTP sent to your email')
      setResendCooldown(60)
      if (cooldownRef.current) clearInterval(cooldownRef.current)
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null }
          return prev - 1
        })
      }, 1000)
    },
    onError: () => toast.error('Failed to resend OTP'),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Verify Email</h1>
          <p className="text-slate-500 text-sm">
            Enter the 6-digit code sent to <strong className="text-slate-700">{search.email}</strong>
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit((values) => { setError(''); verifyMutation.mutate(values.otp) })} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="font-semibold text-[13.5px]">One-Time Password</Label>
            <Input
              id="otp"
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
              className={`text-center text-xl tracking-[0.4em] font-mono ${errors.otp ? 'border-red-400' : ''}`}
              {...register('otp')}
            />
            {errors.otp && <p className="text-xs text-red-500 text-center">{errors.otp.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? 'Verifying…' : 'Verify Account'}
          </Button>
        </form>

        <div className="text-center mt-5 text-sm text-slate-500">
          Didn't receive code?{' '}
          <button
            type="button"
            onClick={() => resendMutation.mutate()}
            disabled={resendCooldown > 0 || resendMutation.isPending}
            className="text-indigo-600 font-medium hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-transparent p-0 inline-flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  )
}
