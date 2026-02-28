import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Heart, ShoppingCart, Trash2, ShoppingBag, Star } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wishlistApi } from '@/api/wishlist'
import { cartApi } from '@/api/cart'
import { toast } from 'sonner'
import AuthGuard from '@/components/shared/AuthGuard'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { WishlistItem } from '@/types'

export const Route = createFileRoute('/_app/wishlist')({
  component: () => (
    <AuthGuard>
      <WishlistPage />
    </AuthGuard>
  ),
})

function WishlistPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: wishlistResp, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get().then((r) => r.data),
  })
  const wishlist = wishlistResp?.data || []

  const removeItem = useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] })
      toast.success('Removed from wishlist')
    },
    onError: () => toast.error('Failed to remove item'),
  })

  const clearWishlist = useMutation({
    mutationFn: wishlistApi.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] })
      toast.success('Wishlist cleared')
    },
  })

  const addToCart = useMutation({
    mutationFn: (productId: string) => cartApi.addItem({ product_id: productId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to add to cart')
    },
  })

  if (isLoading) {
    return (
      <div className="page-container py-10 pb-20">
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    )
  }

  if (!wishlist.length) {
    return (
      <div className="page-container py-10 pb-20 min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center max-w-sm w-full">
          <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h4 className="text-lg font-bold mb-2">Your Wishlist is Empty</h4>
          <p className="text-slate-400 text-sm mb-6">Save your favorite items for later!</p>
          <Button onClick={() => navigate({ to: '/products' })}>
            <ShoppingBag className="w-4 h-4 mr-2" />Browse Products
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-10 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">My Wishlist</h2>
          <p className="text-slate-400 text-sm">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved</p>
        </div>
        {wishlist.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={clearWishlist.isPending}>Clear All</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear wishlist?</AlertDialogTitle>
                <AlertDialogDescription>This will remove all items from your wishlist.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearWishlist.mutate()}>Clear All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((item: WishlistItem) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <Link to="/products/$slug" params={{ slug: item.product.slug }}>
              <div className="relative pt-[100%] bg-slate-50">
                <img
                  src={item.product.images?.[0] || 'https://placehold.co/400x400'}
                  alt={item.product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {!item.product.in_stock && (
                  <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                    <span className="bg-slate-900/95 text-white px-3 py-1.5 rounded-full text-xs font-bold">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </Link>

            <div className="p-4 flex flex-col flex-1">
              <Link to="/products/$slug" params={{ slug: item.product.slug }}
                className="text-sm font-medium text-slate-800 hover:text-indigo-600 leading-tight mb-2 block">
                {item.product.name}
              </Link>

              {(item.product.avg_rating ?? 0) > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.round(item.product.avg_rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">({item.product.review_count})</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-indigo-600">৳{item.product.price.toFixed(2)}</span>
                {item.product.compare_price && item.product.compare_price > item.product.price && (
                  <span className="text-sm text-slate-400 line-through">৳{item.product.compare_price.toFixed(2)}</span>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <Button className="flex-1 text-xs" size="sm"
                  disabled={!item.product.in_stock || addToCart.isPending}
                  onClick={() => addToCart.mutate(item.product.id)}>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />Add to Cart
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove from wishlist?</AlertDialogTitle>
                      <AlertDialogDescription>This item will be removed from your wishlist.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeItem.mutate(item.product.id)}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button variant="outline" size="lg" onClick={() => navigate({ to: '/products' })}>
          Continue Shopping
        </Button>
      </div>
    </div>
  )
}
