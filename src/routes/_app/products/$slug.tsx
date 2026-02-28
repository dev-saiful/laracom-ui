import { createFileRoute, Link } from '@tanstack/react-router'
import { ShoppingCart, CheckCircle2, ThumbsUp, Pencil, Trash2, Star } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { cartApi } from '@/api/cart'
import { reviewsApi } from '@/api/reviews'
import { getErrorMessage } from '@/lib/error'
import ProductCard from '@/components/shared/ProductCard'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'
import type { Review } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/products/$slug')({
  component: ProductDetailPage,
})

function StarRating({ value, max = 5, size = 'sm', onChange }: { value: number; max?: number; size?: 'sm' | 'lg'; onChange?: (v: number) => void }) {
  const sz = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(sz, i < value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200',
            onChange && 'cursor-pointer hover:scale-110 transition-transform')}
          onClick={() => onChange?.(i + 1)}
        />
      ))}
    </div>
  )
}

interface ReviewFormValues { rating: number; title?: string; body?: string }

function ProductDetailPage() {
  const { slug } = Route.useParams()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [selectedImg, setSelectedImg] = useState(0)

  const reviewForm = useForm<ReviewFormValues>({ defaultValues: { rating: 5 } })

  const { data: productResp, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.show(slug).then((r) => r.data),
  })
  const product = productResp?.data

  const { data: relatedResp } = useQuery({
    queryKey: ['related', slug],
    queryFn: () => productsApi.related(slug).then((r) => r.data),
    enabled: !!product,
  })

  const { data: reviewsResp } = useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => reviewsApi.list(slug).then((r) => r.data),
    enabled: !!product,
  })

  const addToCart = useMutation({
    mutationFn: () => cartApi.addItem({ product_id: product!.id, product_variant_id: selectedVariantId || undefined, quantity }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cart-count'] }); toast.success('Added to cart') },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to add to cart')),
  })

  const submitReview = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      editingReview ? reviewsApi.update(editingReview.id, values) : reviewsApi.store({ product_id: product!.id, ...values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      queryClient.invalidateQueries({ queryKey: ['product', slug] })
      toast.success(editingReview ? 'Review updated' : 'Review submitted')
      setReviewModalOpen(false)
      setEditingReview(null)
      reviewForm.reset({ rating: 5 })
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to submit review')),
  })

  const deleteReview = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.destroy(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      queryClient.invalidateQueries({ queryKey: ['product', slug] })
      toast.success('Review deleted')
    },
    onError: () => toast.error('Failed to delete review'),
  })

  const markHelpful = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.markHelpful(reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', slug] }),
    onError: () => toast.error('Failed to mark review'),
  })

  const openEditReview = (review: Review) => {
    setEditingReview(review)
    reviewForm.reset({ rating: review.rating, title: review.title, body: review.body })
    setReviewModalOpen(true)
  }
  const openNewReview = () => { setEditingReview(null); reviewForm.reset({ rating: 5 }); setReviewModalOpen(true) }

  const [reviewRating, setReviewRating] = useState(5)

  if (isLoading) return <div className="page-container section-gap">Loading...</div>
  if (!product) return <div className="page-container section-gap">Product not found</div>

  const currentVariant = product.variants?.find((v) => v.id === selectedVariantId)
  const price = currentVariant ? currentVariant.price : product.price
  const stock = currentVariant ? currentVariant.stock : product.stock
  const inStock = stock > 0

  return (
    <div className="page-container section-gap">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-indigo-600">Products</Link>
        <span>/</span>
        <span className="text-slate-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="rounded-xl overflow-hidden border border-slate-200 mb-3 bg-slate-50 aspect-square">
            <img src={product.images?.[selectedImg] || 'https://placehold.co/600x600'}
              alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {product.images.map((img, i) => (
                <button key={i}
                  className={cn('w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                    i === selectedImg ? 'border-indigo-500' : 'border-slate-200 hover:border-slate-400')}
                  onClick={() => setSelectedImg(i)}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">{product.category.name}</p>
          )}
          <h1 className="text-2xl font-bold mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-5">
            <StarRating value={product.avg_rating ?? 0} />
            <span className="text-sm text-slate-400">({product.review_count} reviews)</span>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl font-extrabold text-indigo-600">৳{price.toFixed(2)}</span>
            {product.discount_percentage && product.discount_percentage > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                -{product.discount_percentage}% OFF
              </span>
            )}
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
              inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <p className="text-slate-500 mb-5">{product.short_description}</p>

          <hr className="border-slate-100 mb-5" />

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-5">
              <p className="font-semibold text-sm mb-2">Select Option:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button key={v.id}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      selectedVariantId === v.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 hover:border-indigo-400',
                      v.stock === 0 && 'opacity-40 cursor-not-allowed'
                    )}
                    disabled={v.stock === 0}
                    onClick={() => setSelectedVariantId(v.id)}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex items-end gap-4">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Quantity</Label>
              <input type="number" min={1} max={stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 border border-slate-200 rounded-lg px-2 py-2 text-center text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <Button size="lg" className="px-8"
              onClick={() => addToCart.mutate()}
              disabled={addToCart.isPending || !inStock}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="desc">
          <TabsList>
            <TabsTrigger value="desc">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.review_count})</TabsTrigger>
          </TabsList>

          <TabsContent value="desc" className="mt-6 max-w-3xl">
            <div
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description || '') }}
              className="prose prose-slate max-w-none"
            />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {/* Rating Summary */}
            {(reviewsResp?.data?.length ?? 0) > 0 && (
              <div className="flex items-center gap-6 mb-8 p-6 bg-slate-50 rounded-2xl">
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-indigo-600">
                    {product.avg_rating?.toFixed(1) ?? '—'}
                  </div>
                  <StarRating value={Math.round(product.avg_rating ?? 0)} size="lg" />
                  <div className="text-sm text-slate-400 mt-1">{product.review_count} review{product.review_count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}

            {/* Write Review */}
            {isAuthenticated ? (
              <Button className="mb-6" onClick={openNewReview}>
                <Pencil className="w-4 h-4 mr-2" />Write a Review
              </Button>
            ) : (
              <p className="text-sm text-slate-400 mb-6">
                <Link to="/auth/login" className="text-indigo-600 underline">Sign in</Link> to write a review.
              </p>
            )}

            {/* Reviews List */}
            {(reviewsResp?.data?.length ?? 0) === 0 ? (
              <p className="text-slate-400 py-8 text-center">No reviews yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {reviewsResp?.data.map((review) => {
                  const isOwner = user?.id === review.user?.id
                  return (
                    <div key={review.id} className="bg-white border border-slate-100 rounded-2xl p-5">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {review.user?.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{review.user?.name ?? 'Anonymous'}</span>
                              <StarRating value={review.rating} />
                              {review.is_verified_purchase && (
                                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />Verified
                                </span>
                              )}
                            </div>
                            {review.title && <p className="text-sm font-medium text-slate-700 mt-0.5">{review.title}</p>}
                            <p className="text-xs text-slate-400 mt-0.5">{dayjs(review.created_at).format('MMM D, YYYY')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600 p-1.5"
                                onClick={() => markHelpful.mutate(review.id)} disabled={markHelpful.isPending}>
                                <ThumbsUp className="w-3.5 h-3.5" />
                                {review.helpful_count > 0 && <span className="ml-1 text-xs">{review.helpful_count}</span>}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Helpful</TooltipContent>
                          </Tooltip>
                          {isOwner && (
                            <>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600 p-1.5"
                                onClick={() => openEditReview(review)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 p-1.5">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete review?</AlertDialogTitle>
                                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteReview.mutate(review.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                      {review.body && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{review.body}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedResp?.data && relatedResp.data.length > 0 && (
        <div className="mt-16">
          <h3 className="text-xl font-bold mb-6">Related Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedResp.data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReview ? 'Edit Your Review' : 'Write a Review'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={reviewForm.handleSubmit((v) => submitReview.mutate({ ...v, rating: reviewRating }))}>
            <div className="space-y-4 py-2">
              <div>
                <Label>Rating</Label>
                <div className="mt-2">
                  <StarRating value={reviewRating} size="lg" onChange={setReviewRating} />
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input className="mt-1" placeholder="Summarise your experience"
                  {...reviewForm.register('title', { required: true })} />
              </div>
              <div>
                <Label>Review</Label>
                <Textarea className="mt-1" rows={4}
                  placeholder="Tell others what you think..." maxLength={2000}
                  {...reviewForm.register('body')} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitReview.isPending}>
                {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
