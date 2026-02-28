import { useState } from 'react'
import { ShoppingCart, Heart, Eye, Star } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import type { Product, WishlistItem, ApiResponse } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/api/cart'
import { wishlistApi } from '@/api/wishlist'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  layout?: 'grid' | 'list'
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [imgError, setImgError] = useState(false)

  const { data: isWishlisted = false } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    select: (data: ApiResponse<WishlistItem[]>) =>
      data.data?.some((item) => item.product_id === product.id) ?? false,
  })

  const addToCart = useMutation({
    mutationFn: () => cartApi.addItem({ product_id: product.id, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success(`"${product.name}" added to cart!`)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to add to cart')
    },
  })

  const toggleWishlist = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (): Promise<any> => isWishlisted ? wishlistApi.remove(product.id) : wishlistApi.add(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] })
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to update wishlist')
    },
  })

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.info('Please login to save items to your wishlist')
      navigate({ to: '/auth/login' })
      return
    }
    toggleWishlist.mutate()
  }

  const imageSrc = !imgError && product.images?.[0]
    ? product.images[0]
    : `https://placehold.co/400x400/f1f5f9/94a3b8?text=${encodeURIComponent(product.name.slice(0, 12))}`

  if (layout === 'list') {
    return (
      <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <Link to="/products/$slug" params={{ slug: product.slug }} className="shrink-0">
          <img
            src={imageSrc} alt={product.name}
            onError={() => setImgError(true)} loading="lazy"
            className="w-24 h-24 object-cover rounded-lg bg-slate-100"
          />
        </Link>
        <div className="flex-1 flex flex-col gap-1">
          {product.category && (
            <span className="text-[11px] text-primary font-bold uppercase tracking-wider">{product.category.name}</span>
          )}
          <Link to="/products/$slug" params={{ slug: product.slug }} className="no-underline">
            <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">{product.name}</p>
          </Link>
          {(product.avg_rating ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn('h-3 w-3', i < Math.round(product.avg_rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
              ))}
              <span className="text-xs text-slate-400">({product.review_count})</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-lg font-bold text-primary">৳{product.price.toFixed(2)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm line-through text-slate-400">৳{product.compare_price.toFixed(2)}</span>
            )}
            <Button
              size="sm" disabled={!product.in_stock || addToCart.isPending}
              onClick={(e) => { e.preventDefault(); addToCart.mutate() }}
              className="ml-auto"
            >
              <ShoppingCart className="h-3 w-3" />
              {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <article className="product-card group relative bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300" aria-label={product.name}>
      {/* Image */}
      <div className="relative overflow-hidden bg-slate-50 aspect-square">
        <Link to="/products/$slug" params={{ slug: product.slug }} tabIndex={-1}>
          <img
            src={imageSrc} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy" decoding="async"
            onError={() => setImgError(true)}
          />
        </Link>

        {product.discount_percentage && product.discount_percentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            -{product.discount_percentage}%
          </span>
        )}

        {!product.in_stock && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/15">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist btn */}
        <button
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          onClick={handleWishlistClick}
          disabled={toggleWishlist.isPending}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200',
            'opacity-0 group-hover:opacity-100',
            isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-400',
          )}
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
        </button>

        {/* Hover actions */}
        <div className="absolute bottom-0 inset-x-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            className="flex-1 font-semibold"
            disabled={!product.in_stock || addToCart.isPending}
            onClick={(e) => { e.preventDefault(); addToCart.mutate() }}
            size="sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          <Button
            variant="secondary" size="sm"
            onClick={(e) => { e.preventDefault(); navigate({ to: '/products/$slug', params: { slug: product.slug } }) }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {product.category && (
          <span className="text-[10.5px] text-primary font-bold uppercase tracking-widest block mb-1">{product.category.name}</span>
        )}

        <Link to="/products/$slug" params={{ slug: product.slug }} className="no-underline">
          <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-2">{product.name}</p>
        </Link>

        <div className="flex flex-wrap gap-1 mb-2">
          {!product.in_stock && <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Out of Stock</span>}
          {product.is_featured && <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Featured</span>}
        </div>

        {(product.avg_rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn('h-3 w-3', i < Math.round(product.avg_rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
            ))}
            <span className="text-xs text-slate-400">({product.review_count})</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">৳{product.price.toFixed(2)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-sm line-through text-slate-400">৳{product.compare_price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </article>
  )
}

