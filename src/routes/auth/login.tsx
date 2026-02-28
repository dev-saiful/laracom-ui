import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
})
type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

const FEATURES = [
  { icon: '🚀', text: 'Faster checkout with saved details' },
  { icon: '📦', text: 'Track all your orders in one place' },
  { icon: '💝', text: 'Exclusive deals for members' },
]

function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      const { user, access_token, refresh_token } = res.data.data
      setAuth(user, access_token, refresh_token)
      navigate({ to: user.role === 'admin' ? '/admin' : '/' })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message || 'Invalid email or password.')
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-linear-to-br from-indigo-700 via-purple-700 to-violet-700 flex-col justify-center px-12 py-16 relative overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-[15%] left-[-5%] w-72 h-72 bg-white/4 rounded-full" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-10 no-underline transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to store
          </Link>
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/15 border border-white/30 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm shadow-xl">🛍️</div>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Welcome back!</h2>
          <p className="text-white/75 text-[15px] leading-relaxed mb-10">
            Sign in to access your orders, wishlist, and exclusive member deals.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 bg-white/12 rounded-xl flex items-center justify-center text-base">{icon}</div>
                <span className="text-white/82 text-sm">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}</div>
            <p className="text-white/90 text-[13.5px] leading-relaxed italic">"Best shopping experience ever! Fast delivery and amazing product quality."</p>
            <p className="text-white/60 text-xs mt-2">— Sarah K., Verified Customer</p>
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
              <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Sign in to your account</h1>
              <p className="text-slate-500 text-sm">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-indigo-600 font-semibold no-underline hover:underline">Create one free</Link>
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit((values) => { setError(''); loginMutation.mutate(values) })} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-semibold text-[13.5px]">Email address</Label>
                <Input
                  id="email" type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold text-[13.5px]">Password</Label>
                  <Link to="/auth/forgot-password" className="text-indigo-600 text-xs font-medium no-underline hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    {...register('password')}
                    className={errors.password ? 'border-red-400 focus-visible:ring-red-400 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent p-0 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Signing in…' : (
                  <><span>Sign In</span><ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
