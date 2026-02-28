import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { CartItem } from '@/types'

export const Route = createFileRoute('/_app/cart')({
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: cartResp, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data),
  })
  const cart = cartResp?.data

  const updateItem = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => cartApi.updateItem(id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
    },
    onError: () => toast.error('Failed to update cart'),
  })

  const removeItem = useMutation({
    mutationFn: (id: string) => cartApi.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      toast.success('Item removed')
    },
  })

  const clearCart = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      toast.success('Cart cleared')
    },
  })

  if (isLoading) return <div className="page-container section-gap">Loading...</div>

  if (!cart || cart.items.length === 0) {
    return (
      <div className="page-container section-gap flex items-center justify-center py-20">
        <div className="bg-white rounded-3xl p-16 shadow-lg max-w-lg w-full text-center border border-slate-100">
          <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-6">Your cart is empty</h3>
          <Link to="/products">
            <Button size="lg" className="px-8">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container section-gap">
      <h2 className="text-2xl font-bold mb-8">Shopping Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subtotal</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item: CartItem) => (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product.images?.[0] || 'https://placehold.co/100x100'}
                            alt={item.product.name}
                            className="w-14 h-14 object-cover rounded-lg border border-slate-100"
                          />
                          <div>
                            <Link to="/products/$slug" params={{ slug: item.product.slug }}
                              className="font-medium text-sm text-slate-800 hover:text-indigo-600 block">
                              {item.product.name}
                            </Link>
                            {item.variant && <p className="text-xs text-slate-400 mt-0.5">{item.variant.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">৳{item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const v = parseInt(e.target.value)
                            if (v > 0) updateItem.mutate({ id: item.id, qty: v })
                          }}
                          disabled={updateItem.isPending}
                          className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-4 font-semibold text-sm">৳{item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2"
                          onClick={() => removeItem.mutate(item.id)}
                          disabled={removeItem.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 text-sm">
                    Clear Cart
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear cart?</AlertDialogTitle>
                    <AlertDialogDescription>This will remove all items from your cart.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearCart.mutate()}>Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <h4 className="font-bold text-lg mb-5">Order Summary</h4>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">৳{cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 mb-5 flex justify-between items-center">
              <span className="font-bold text-base">Total</span>
              <span className="font-bold text-lg text-indigo-600">৳{cart.total.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate({ to: '/checkout' })}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
