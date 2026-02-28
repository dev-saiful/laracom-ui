import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import type { Product, ProductVariant } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/admin/_layout/inventory/')({
  component: AdminInventoryPage,
})

function AdminInventoryPage() {
  const queryClient = useQueryClient()
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['admin', 'inventory', lowStockOnly, page],
    queryFn: () => adminApi.inventory.list({ low_stock: lowStockOnly, page }).then((r) => r.data),
  })

  const adjustMutation = useMutation({
    mutationFn: ({ id, type, adjustment }: { id: string; type: 'product' | 'variant'; adjustment: number }) =>
      adminApi.inventory.adjust(id, { type, adjustment }),
    onMutate: ({ id }) => setMutatingId(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] }); toast.success('Stock updated') },
    onError: () => toast.error('Failed to update stock'),
    onSettled: () => setMutatingId(null),
  })

  const handleAdjust = (id: string, type: 'product' | 'variant', amount: number) => {
    adjustMutation.mutate({ id, type, adjustment: amount })
  }

  const meta = inventoryData?.meta
  const totalPages = meta?.last_page ?? 1

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory</h1>
        <p className="text-sm text-slate-400 mt-0.5">Track and adjust stock levels</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-5">
        <Checkbox
          id="low-stock"
          checked={lowStockOnly}
          onCheckedChange={(v) => { setLowStockOnly(!!v); setPage(1) }}
        />
        <Label htmlFor="low-stock" className="cursor-pointer">Show Low Stock Only</Label>
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
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Item</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(inventoryData?.data ?? []).map((product: Product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-400">
                        {product.variants && product.variants.length > 0
                          ? `${product.variants.length} Variants`
                          : 'Single Product'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {product.variants && product.variants.length > 0 ? (
                        <div className="space-y-2">
                          {product.variants.map((v: ProductVariant) => (
                            <div key={v.id} className="flex items-center gap-3 text-xs">
                              <span className="min-w-25 text-slate-500">{v.name}:</span>
                              <span className="font-bold text-slate-800 min-w-6 text-center">{v.stock}</span>
                              <div className="flex gap-1">
                                <button
                                  className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                                  disabled={mutatingId === v.id && adjustMutation.isPending}
                                  onClick={() => handleAdjust(v.id, 'variant', 1)}
                                >
                                  {mutatingId === v.id && adjustMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                </button>
                                <button
                                  className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                                  disabled={mutatingId === v.id && adjustMutation.isPending}
                                  onClick={() => handleAdjust(v.id, 'variant', -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg text-slate-800">{product.stock}</span>
                          <div className="flex gap-1">
                            <button
                              className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                              disabled={mutatingId === product.id && adjustMutation.isPending}
                              onClick={() => handleAdjust(product.id, 'product', 1)}
                            >
                              {mutatingId === product.id && adjustMutation.isPending
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
                              disabled={mutatingId === product.id && adjustMutation.isPending}
                              onClick={() => handleAdjust(product.id, 'product', -1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(inventoryData?.data ?? []).length === 0 && (
                  <tr><td colSpan={2} className="py-16 text-center text-slate-400">No items found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>Page {page} of {totalPages} &middot; {meta?.total} items</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
