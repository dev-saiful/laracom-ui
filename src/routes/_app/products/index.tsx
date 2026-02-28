import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/api/products'
import ProductCard from '@/components/shared/ProductCard'
import { useState } from 'react'
import type { ProductFilters, Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export const Route = createFileRoute('/_app/products/')({
  component: ProductListPage,
  validateSearch: (search: Record<string, unknown>): ProductFilters => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || undefined,
    category: (search.category as string) || undefined,
    min_price: search.min_price ? Number(search.min_price) : undefined,
    max_price: search.max_price ? Number(search.max_price) : undefined,
    sort: (['price_asc', 'price_desc', 'newest', 'popular'].includes(search.sort as string)
      ? search.sort : 'newest') as ProductFilters['sort'],
    in_stock: search.in_stock === true,
  }),
})

interface FilterPanelProps {
  filters: ProductFilters
  categories: Category[] | undefined
  onFilter: (f: Partial<ProductFilters>) => void
}

function FilterPanel({ filters, categories, onFilter }: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <p className="font-bold text-sm mb-2">Category</p>
        <Select value={filters.category ?? '__all__'} onValueChange={(v) => onFilter({ category: v === '__all__' ? undefined : v })}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="font-bold text-sm mb-2">Price Range</p>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500 font-semibold">
            <span>${filters.min_price ?? 0}</span>
            <span>${filters.max_price ?? 1000}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={filters.max_price ?? 1000}
            onChange={(e) => onFilter({ max_price: Number(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Checkbox
            id="in_stock"
            checked={!!filters.in_stock}
            onCheckedChange={(v) => onFilter({ in_stock: !!v })}
          />
          <Label htmlFor="in_stock" className="text-sm font-medium cursor-pointer">In Stock Only</Label>
        </div>
      </div>
    </div>
  )
}

function ProductListPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_app/products/' })
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.list(search).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data.data),
  })

  const updateFilter = (newFilter: Partial<ProductFilters>) => {
    navigate({ to: '/products', search: (prev) => ({ ...prev, ...newFilter, page: 1 }) })
  }

  const currentPage = productsData?.meta.current_page ?? 1
  const totalPages = productsData?.meta.last_page ?? 1

  return (
    <div className="page-container section-gap">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="flex gap-3 items-center">
          {/* Mobile filter button */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Filter className="w-4 h-4 mr-2" />Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-6">
                <FilterPanel filters={search} categories={categories} onFilter={(f) => { updateFilter(f); setMobileFilterOpen(false) }} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Select value={search.sort ?? 'newest'} onValueChange={(val) => updateFilter({ sort: val as ProductFilters['sort'] })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Arrivals</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-24">
            <FilterPanel filters={search} categories={categories} onFilter={updateFilter} />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : productsData?.data.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData?.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1}
                    onClick={() => navigate({ to: '/products', search: (prev) => ({ ...prev, page: currentPage - 1 }) })}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
                    onClick={() => navigate({ to: '/products', search: (prev) => ({ ...prev, page: currentPage + 1 }) })}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
