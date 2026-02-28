import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { ordersApi } from '@/api/orders'
import { useAuthStore } from '@/store/auth'
import { getErrorMessage } from '@/lib/error'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { CheckCircle2, CreditCard, Package, MapPin, Truck } from 'lucide-react'

const SHIPPING_ZONES = [
  { value: 'inside_dhaka',  label: 'Inside Dhaka',  cost: 60,  days: '1–2 days',  icon: '🏙️' },
  { value: 'outside_dhaka', label: 'Outside Dhaka', cost: 120, days: '3–5 days',  icon: '🗺️' },
] as const

type ShippingZone = typeof SHIPPING_ZONES[number]['value']

interface CheckoutFormValues {
  name: string
  phone: string
  address: string
  city: string
  country: string
  email?: string        // optional for guests
  billing_name?: string
  billing_phone?: string
  billing_address?: string
  billing_city?: string
  billing_country?: string
  payment_method: string
  notes?: string
}

export const Route = createFileRoute('/_app/checkout')({
  component: CheckoutPage,
})

const STEPS = [
  { label: 'Shipping', icon: MapPin },
  { label: 'Payment', icon: CreditCard },
  { label: 'Review', icon: Package },
]

function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [billingSame, setBillingSame] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [shippingZone, setShippingZone] = useState<ShippingZone>('inside_dhaka')

  const shippingCost = SHIPPING_ZONES.find(z => z.value === shippingZone)?.cost ?? 60

  const { register, handleSubmit, getValues, trigger, formState: { errors } } = useForm<CheckoutFormValues>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      country: 'Bangladesh',
      payment_method: 'cod',
    },
  })

  const { data: cartResp, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data),
  })
  const cart = cartResp?.data

  const checkoutMutation = useMutation({
    mutationFn: (values: CheckoutFormValues) => {
      const billingAddress = billingSame ? undefined : {
        name: values.billing_name ?? '',
        phone: values.billing_phone ?? '',
        address: values.billing_address ?? '',
        city: values.billing_city ?? '',
        country: values.billing_country ?? '',
      }
      const payload = {
        shipping_address: { name: values.name, phone: values.phone, address: values.address, city: values.city, country: values.country },
        billing_address: billingAddress,
        payment_method: paymentMethod,
        shipping_zone: shippingZone,
        notes: values.notes,
      }
      if (isAuthenticated) return ordersApi.checkout(payload)
      return ordersApi.guestCheckout({
        ...payload,
        guest_email: values.email || undefined,
        guest_phone: values.phone,
        items: cart!.items.map(item => ({
          product_id: item.product.id,
          product_variant_id: item.variant?.id,
          quantity: item.quantity,
        })),
      })
    },
    onSuccess: (res) => {
      queryClient.removeQueries({ queryKey: ['cart'] })
      queryClient.setQueryData(['cart-count'], 0)
      const orderId = res.data.data.id
      const orderNumber = res.data.data.order_number
      if (isAuthenticated) {
        navigate({ to: '/orders/$id', params: { id: orderId }, search: { success: 'true' } })
      } else {
        navigate({ to: '/track', search: { orderNumber, success: 'true' } })
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Checkout failed. Please try again.')),
  })

  if (cartLoading) return <div className="page-container section-gap">Loading...</div>
  if (!cart || cart.items.length === 0) return <div className="page-container section-gap">Cart is empty</div>

  const goToStep2 = async () => {
    // email is always optional; phone, name, address, city, country are required
    const fields: (keyof CheckoutFormValues)[] = ['phone', 'name', 'address', 'city', 'country']
    if (!billingSame) fields.push('billing_name', 'billing_address', 'billing_city', 'billing_country')
    const ok = await trigger(fields)
    if (ok) setCurrentStep(1)
  }

  const onSubmit = (values: CheckoutFormValues) => checkoutMutation.mutate(values)

  return (
    <div className="page-container section-gap">
      <h2 className="text-2xl font-bold mb-8">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-6">
            {/* Steps indicator */}
            <div className="flex items-center mb-10">
              {STEPS.map((step, idx) => (
                <div key={step.label} className="flex items-center flex-1 last:flex-none">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    idx < currentStep ? 'bg-indigo-600 text-white'
                      : idx === currentStep ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : 'bg-slate-100 text-slate-400'
                  )}>
                    {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={cn('ml-2 text-sm font-medium hidden sm:block', idx <= currentStep ? 'text-indigo-600' : 'text-slate-400')}>
                    {step.label}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <div className={cn('flex-1 h-0.5 mx-3', idx < currentStep ? 'bg-indigo-600' : 'bg-slate-100')} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Shipping */}
              {currentStep === 0 && (
                <div className="space-y-5">

                  {/* Contact Information */}
                  <h4 className="text-base font-bold text-slate-900">Contact Information</h4>

                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="e.g. 01700000000"
                      {...register('phone', { required: 'Phone number is required' })}
                      className={cn('mt-1', errors.phone && 'border-red-500')}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email Address <span className="text-slate-400 font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com (for order confirmation)"
                      disabled={isAuthenticated}
                      {...register('email', {
                        validate: (v) => !v || /^[^@]+@[^@]+\.[^@]+$/.test(v) || 'Enter a valid email address',
                      })}
                      className={cn('mt-1', errors.email && 'border-red-500')}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <hr className="border-slate-100" />

                  {/* Shipping Address */}
                  <h4 className="text-base font-bold text-slate-900">Shipping Address</h4>

                  <div>
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="name" placeholder="Recipient's full name"
                      {...register('name', { required: 'Name is required' })}
                      className={cn('mt-1', errors.name && 'border-red-500')} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                    <Textarea id="address" rows={2} placeholder="House, Road, Area"
                      {...register('address', { required: 'Address is required' })}
                      className={cn('mt-1', errors.address && 'border-red-500')} />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                      <Input id="city" placeholder="Dhaka"
                        {...register('city', { required: 'City is required' })}
                        className={cn('mt-1', errors.city && 'border-red-500')} />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                      <Input id="country"
                        {...register('country', { required: 'Country is required' })}
                        className={cn('mt-1', errors.country && 'border-red-500')} />
                      {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Delivery Zone */}
                  <div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">Delivery Zone</h4>
                    <p className="text-xs text-slate-400 mb-3">Select your delivery area to see shipping charges</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SHIPPING_ZONES.map((zone) => (
                        <button
                          key={zone.value}
                          type="button"
                          onClick={() => setShippingZone(zone.value)}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                            shippingZone === zone.value
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-indigo-300'
                          )}
                        >
                          <span className="text-2xl">{zone.icon}</span>
                          <div className="flex-1">
                            <div className={cn('font-bold text-sm', shippingZone === zone.value ? 'text-indigo-700' : 'text-slate-800')}>
                              {zone.label}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">Delivery in {zone.days}</div>
                          </div>
                          <div className={cn('font-bold text-sm shrink-0', shippingZone === zone.value ? 'text-indigo-600' : 'text-slate-600')}>
                            ৳{zone.cost}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Billing Same */}
                  <div className="flex items-center gap-2">
                    <Checkbox id="billing_same" checked={billingSame} onCheckedChange={(v) => setBillingSame(!!v)} />
                    <Label htmlFor="billing_same" className="cursor-pointer font-normal">
                      Billing address is the same as shipping address
                    </Label>
                  </div>

                  {!billingSame && (
                    <div className="space-y-4">
                      <h4 className="text-base font-bold">Billing Address</h4>
                      <div>
                        <Label>Full Name</Label>
                        <Input {...register('billing_name', { required: !billingSame })} className="mt-1" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input {...register('billing_phone')} className="mt-1" />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Textarea rows={2} {...register('billing_address', { required: !billingSame })} className="mt-1" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input {...register('billing_city', { required: !billingSame })} className="mt-1" />
                        </div>
                        <div>
                          <Label>Country</Label>
                          <Input {...register('billing_country', { required: !billingSame })} className="mt-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="button" onClick={goToStep2} className="mt-2 w-full sm:w-auto">
                    Continue to Payment
                  </Button>
                </div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold">Payment Method</h4>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer font-medium text-base">Cash on Delivery (COD)</Label>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed">
                      <RadioGroupItem value="stripe" id="stripe" disabled />
                      <Label htmlFor="stripe" className="font-medium text-base text-slate-400">Credit Card (Coming Soon)</Label>
                    </div>
                  </RadioGroup>
                  <div className="flex gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(0)}>Back</Button>
                    <Button type="button" onClick={() => setCurrentStep(2)}>Review Order</Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold">Order Review</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                    Please confirm your order details before placing the order.
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm">
                    <p className="text-slate-500 mb-1">Shipping to:</p>
                    <p className="font-medium">{getValues('address')}, {getValues('city')}</p>
                    <p className="text-slate-500 mt-2 mb-1">Payment:</p>
                    <p className="font-medium capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</p>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                    <Button type="submit" size="lg" disabled={checkoutMutation.isPending}>
                      {checkoutMutation.isPending ? 'Placing Order...' : `Place Order — ৳${(cart.total + shippingCost).toFixed(2)}`}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <h4 className="font-bold text-lg mb-5">Order Summary</h4>
            <div className="max-h-96 overflow-y-auto mb-4 space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative shrink-0">
                    <img src={item.product.images?.[0]} alt={item.product.name}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-100" />
                    <span className="absolute -top-2 -right-2 bg-slate-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px]">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs leading-tight">{item.product.name}</p>
                    {item.variant && <p className="text-xs text-slate-400">{item.variant.name}</p>}
                  </div>
                  <p className="text-sm font-medium shrink-0">৳{item.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <hr className="border-slate-100 my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">৳{cart.total.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Shipping
                  <span className="text-xs bg-slate-100 rounded px-1.5 py-0.5 font-medium">
                    {SHIPPING_ZONES.find(z => z.value === shippingZone)?.label}
                  </span>
                </span>
                <span className="font-semibold text-slate-700">৳{shippingCost}</span>
              </div>
            </div>
            <hr className="border-slate-100 my-3" />
            <div className="flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg text-indigo-600">৳{(cart.total + shippingCost).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
