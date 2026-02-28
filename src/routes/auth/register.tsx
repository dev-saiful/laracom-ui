import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useState } from 'react'
import { getErrorMessage } from '@/lib/error'
import type { RegisterPayload } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})
type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

const PERKS = [
  'Free shipping on first order',
  'Exclusive member-only deals',
  'Priority customer support',
  'Easy returns within 30 days',
]

function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const registerMutation = useMutation({
    mutationFn: (values: RegisterPayload) => authApi.register(values),
    onSuccess: (_, variables) => {
      navigate({ to: '/auth/verify-otp', search: { email: variables.email } })
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'))
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-[40%] bg-linear-to-br from-violet-700 via-purple-700 to-indigo-700 flex-col justify-center px-12 py-16 relative overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-[15%] left-[-5%] w-64 h-64 bg-white/4 rounded-full" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-10 no-underline transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to store
          </Link>
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/15 border border-white/30 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm shadow-xl">🛍️</div>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Join Laracom</h2>
          <p className="text-white/75 text-[15px] leading-relaxed mb-10">
            Create your free account and start enjoying exclusive member benefits today.
          </p>
          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-white/85 text-sm">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <span className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-lg">🛍️</span>
              <span className="text-xl font-black tracking-tight">Lara<span className="text-indigo-600">com</span></span>
            </Link>
            <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 no-underline transition-colors">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Create your account</h1>
              <p className="text-slate-500 text-sm">
                Already have one?{' '}
                <Link to="/auth/login" className="text-indigo-600 font-semibold no-underline hover:underline">Sign in</Link>
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit((values) => { setError(''); registerMutation.mutate(values as RegisterPayload) })} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-semibold text-[13.5px]">Full Name</Label>
                <Input id="name" placeholder="John Doe" {...register('name')} className={errors.name ? 'border-red-400' : ''} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-semibold text-[13.5px]">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} className={errors.email ? 'border-red-400' : ''} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="font-semibold text-[13.5px]">Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input id="phone" placeholder="+1 234 567 8900" {...register('phone')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-semibold text-[13.5px]">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    {...register('password')}
                    className={`pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent p-0 cursor-pointer">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password_confirmation" className="font-semibold text-[13.5px]">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  placeholder="Repeat your password"
                  {...register('password_confirmation')}
                  className={errors.password_confirmation ? 'border-red-400' : ''}
                />
                {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>}
              </div>

              <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
