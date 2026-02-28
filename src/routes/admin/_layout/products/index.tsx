import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search, Copy, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/_layout/products/')({
  component: AdminProductsPage,
})

function AdminProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin', 'products', debouncedSearch, page],
    queryFn: () => adminApi.products.list({ search: debouncedSearch, page }).then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: (id: string) => adminApi.products.toggleActive(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); toast.success('Status updated') },
    onSettled: () => setMutatingId(null),
  })

  const toggleFeatured = useMutation({
    mutationFn: (id: string) => adminApi.products.toggleFeatured(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); toast.success('Featured status updated') },
    onSettled: () => setMutatingId(null),
  })

  const duplicateProduct = useMutation({
    mutationFn: (id: string) => adminApi.products.duplicate(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); toast.success('Product duplicated') },
    onSettled: () => setMutatingId(null),
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => adminApi.products.destroy(id),
    onMutate: (id) => setMutatingId(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); toast.success('Product deleted') },
    onSettled: () => setMutatingId(null),
  })

  const meta = productsData?.meta
  const totalPages = meta?.last_page ?? 1

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your product catalogue</p>
        </div>
        <Link to="/admin/products/$id" params={{ id: 'new' }}>
          <Button size="sm" className="gap-1.5 shrink-0"><Plus className="h-4 w-4" />Add Product</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Price</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Stock</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 hidden sm:table-cell">Active</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 hidden lg:table-cell">Featured</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(productsData?.data ?? []).map((p: Product) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                          : <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" />}
                        <div>
                          <p className="font-medium text-slate-800">{p.name}</p>
                          {p.category && <p className="text-xs text-slate-400">{p.category.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">৳{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                        p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}>
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <Switch
                        checked={p.is_active}
                        disabled={mutatingId === p.id && toggleActive.isPending}
                        onCheckedChange={() => toggleActive.mutate(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <Switch
                        checked={p.is_featured}
                        disabled={mutatingId === p.id && toggleFeatured.isPending}
                        onCheckedChange={() => toggleFeatured.mutate(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50"
                          title="Duplicate"
                          disabled={mutatingId === p.id && duplicateProduct.isPending}
                          onClick={() => duplicateProduct.mutate(p.id)}
                        >
                          {mutatingId === p.id && duplicateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <Link to="/admin/products/$id" params={{ id: p.id }}>
                          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500"><Pencil className="h-4 w-4" /></button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1.5 rounded hover:bg-red-50 text-red-500">
                              {mutatingId === p.id && deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete "{p.name}". This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteProduct.mutate(p.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {(productsData?.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <ShoppingBag className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium">No products found</p>
                      <p className="text-slate-400 text-xs mt-1">{search ? 'Try a different search term' : 'Add your first product to get started'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>Page {page} of {totalPages} &middot; {meta?.total} products</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
