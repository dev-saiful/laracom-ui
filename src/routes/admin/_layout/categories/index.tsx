import { createFileRoute } from '@tanstack/react-router'
import { Plus, Pencil, Trash2, Folder, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { getErrorMessage } from '@/lib/error'
import { useState } from 'react'
import type { Category } from '@/types'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/_layout/categories/')({
  component: AdminCategoriesPage,
})

interface CategoryFormValues {
  name: string
  description?: string
  parent_id?: string
  sort_order: number
  image?: string
  is_active: boolean
}

function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [page, setPage] = useState(1)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormValues>({
    defaultValues: { is_active: true, sort_order: 0 },
  })

  const { data: resp, isLoading } = useQuery({
    queryKey: ['admin', 'categories', search, page],
    queryFn: () => adminApi.categories.list({ search: search || undefined, per_page: 20, page }).then((r) => r.data),
  })

  const { data: rootResp } = useQuery({
    queryKey: ['admin', 'categories', 'root'],
    queryFn: () => adminApi.categories.list({ root_only: true, per_page: 100 }).then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (values: Partial<Category>) =>
      editingCategory ? adminApi.categories.update(editingCategory.id, values) : adminApi.categories.store(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(editingCategory ? 'Category updated' : 'Category created')
      setModalOpen(false)
      reset()
      setEditingCategory(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to save category')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.categories.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Cannot delete category')),
  })

  const openNew = () => {
    setEditingCategory(null)
    reset({ is_active: true, sort_order: 0, name: '', description: '', parent_id: '', image: '' })
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    reset({
      name: cat.name,
      description: cat.description ?? '',
      parent_id: cat.parent_id ?? cat.parent?.id ?? '',
      image: cat.image ?? '',
      is_active: cat.is_active ?? true,
      sort_order: cat.sort_order ?? 0,
    })
    setModalOpen(true)
  }

  const isActive = watch('is_active')
  const parentId = watch('parent_id')
  const meta = resp?.meta
  const totalPages = meta?.last_page ?? 1

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categories</h1>
          <p className="text-sm text-slate-400 mt-0.5">{meta?.total ?? 0} total categories</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" />New Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Slug</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 hidden sm:table-cell">Products</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 hidden lg:table-cell">Sort</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(resp?.data ?? []).map((cat: Category) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cat.image
                          ? <img src={cat.image} alt={cat.name} className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0" />
                          : <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0"><Folder className="h-4 w-4 text-orange-500" /></div>}
                        <div>
                          <p className="font-medium text-slate-800">{cat.name}</p>
                          {cat.parent && <p className="text-xs text-slate-400">↳ {cat.parent.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{cat.slug}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', (cat.products_count ?? 0) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
                        {cat.products_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cat.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400 hidden lg:table-cell">{cat.sort_order ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500" onClick={() => openEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1.5 rounded hover:bg-red-50 text-red-400">
                              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone. Products assigned to this category will lose it.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(cat.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); setEditingCategory(null); reset() } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? `Edit: ${editingCategory.name}` : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form id="cat-form" onSubmit={handleSubmit((v) => saveMutation.mutate(v as Partial<Category>))} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name <span className="text-red-500">*</span></Label>
              <Input id="cat-name" placeholder="e.g. Electronics" {...register('name', { required: 'Name is required' })} className={errors.name ? 'border-red-400' : ''} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <textarea id="cat-desc" rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional category description" {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Parent Category</Label>
                <Select value={parentId ?? ''} onValueChange={(v) => setValue('parent_id', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {(rootResp?.data ?? [])
                      .filter((c) => c.id !== editingCategory?.id)
                      .map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input id="sort-order" type="number" min={0} {...register('sort_order', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-image">Image URL</Label>
              <Input id="cat-image" placeholder="https://..." {...register('image')} />
            </div>

            <div className="flex items-center gap-3">
              <Switch id="cat-active" checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
              <Label htmlFor="cat-active">Active</Label>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditingCategory(null); reset() }}>Cancel</Button>
            <Button type="submit" form="cat-form" disabled={saveMutation.isPending} className="gap-1.5">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
