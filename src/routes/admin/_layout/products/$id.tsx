import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Plus, ArrowLeft, Trash2, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { categoriesApi } from '@/api/products'
import { getErrorMessage } from '@/lib/error'
import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ImageUploader } from '@/components/shared/ImageUploader'

export const Route = createFileRoute('/admin/_layout/products/$id')({
  component: ProductFormPage,
})

interface VariantField { id?: string; name: string; price: number; stock: number; sku: string }
interface ProductFormValues {
  name: string
  category_id: string
  stock: number
  price: number
  compare_price?: number
  short_description: string
  description?: string
  is_active: boolean
  is_featured: boolean
  images: string[]
  variants: VariantField[]
}

function ProductFormPage() {
  const { id } = Route.useParams()
  const isEdit = id !== 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<ProductFormValues>({
    defaultValues: { is_active: true, is_featured: false, stock: 0, price: 0, images: [], variants: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data.data),
  })

  const { data: productResp, isLoading } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => adminApi.products.show(id).then((r) => r.data),
    enabled: isEdit,
  })
  const product = productResp?.data

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category_id: product.category?.id ?? '',
        stock: product.stock,
        price: product.price,
        compare_price: product.compare_price,
        short_description: product.short_description,
        description: product.description,
        is_active: product.is_active,
        is_featured: product.is_featured,
        images: product.images ?? [],
        variants: product.variants ?? [],
      })
    }
  }, [product, reset])

  const saveMutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const payload: Record<string, unknown> = { ...values }
      if (Array.isArray(payload.variants)) {
        payload.variants = (payload.variants as VariantField[]).filter((v) => v && v.name)
      }
      // Use uploaded images (or a single auto-generated placeholder when none provided)
      if (!Array.isArray(payload.images) || (payload.images as string[]).length === 0) {
        payload.images = [
          `https://placehold.co/600x600/f1f5f9/94a3b8?text=${encodeURIComponent(values.name)}`,
        ]
      }
      return isEdit ? adminApi.products.update(id, payload) : adminApi.products.store(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Product saved successfully')
      navigate({ to: '/admin/products' })
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to save product')),
  })

  if (isEdit && isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
  }

  const isActive = watch('is_active')
  const isFeatured = watch('is_featured')
  const categoryId = watch('category_id')
  const images = watch('images') ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/products">
          <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" />Back</Button>
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {isEdit ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800">Basic Information</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
            <Input id="name" {...register('name', { required: 'Name is required' })} className={errors.name ? 'border-red-400' : ''} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={categoryId} onValueChange={(v) => setValue('category_id', v)}>
                <SelectTrigger className={errors.category_id ? 'border-red-400' : ''}>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock Quantity <span className="text-red-500">*</span></Label>
              <Input id="stock" type="number" min={0} {...register('stock', { required: true, valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price ($) <span className="text-red-500">*</span></Label>
              <Input id="price" type="number" min={0} step={0.01} {...register('price', { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compare_price">Compare Price ($)</Label>
              <Input id="compare_price" type="number" min={0} step={0.01} {...register('compare_price', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="short_description">Short Description <span className="text-red-500">*</span></Label>
            <textarea
              id="short_description"
              rows={2}
              maxLength={255}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('short_description', { required: 'Short description is required' })}
            />
            {errors.short_description && <p className="text-xs text-red-500">{errors.short_description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Detailed Description</Label>
            <textarea
              id="description"
              rows={5}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('description')}
            />
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Status & Visibility</h2>
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <Switch id="is_active" checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="is_featured" checked={isFeatured} onCheckedChange={(v) => setValue('is_featured', v)} />
              <Label htmlFor="is_featured">Featured</Label>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Variants</h2>
          {fields.length > 0 && (
            <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_auto] gap-2 mb-1 px-1">
              {['Name', 'Price ($)', 'Stock', 'SKU', ''].map((h) => (
                <span key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_auto] gap-2 items-center">
                <Input placeholder="e.g. Red / XL" {...register(`variants.${index}.name`, { required: true })} className={errors.variants?.[index]?.name ? 'border-red-400' : ''} />
                <Input type="number" min={0} step={0.01} placeholder="0.00" {...register(`variants.${index}.price`, { valueAsNumber: true })} />
                <Input type="number" min={0} placeholder="0" {...register(`variants.${index}.stock`, { valueAsNumber: true })} />
                <Input placeholder="SKU-001" {...register(`variants.${index}.sku`)} />
                <button type="button" className="p-1.5 rounded hover:bg-red-50 text-red-400" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => append({ name: '', price: 0, stock: 0, sku: '' })}
            className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 border border-dashed border-indigo-300 rounded-lg px-3 py-2 hover:bg-indigo-50 transition-colors">
            <Plus className="h-4 w-4" />Add Variant
          </button>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Product Images</h2>
              <p className="text-xs text-slate-400 mt-0.5">First image is used as the main thumbnail</p>
            </div>
            {images.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">{images.length} / 6 uploaded</span>
            )}
          </div>
          <ImageUploader
            value={images}
            onChange={(urls) => setValue('images', urls, { shouldDirty: true })}
            folder="products"
            maxImages={6}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-10">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/admin/products' })}>Cancel</Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-1.5">
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Product
          </Button>
        </div>
      </form>
    </div>
  )
}
