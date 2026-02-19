import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { 
  Row, Col, Select, Slider, Checkbox, 
  Typography, Pagination, Empty, Spin, Button, Drawer
} from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/api/products'
import ProductCard from '@/components/shared/ProductCard'
import { useState } from 'react'
import type { ProductFilters, Category } from '@/types'

const { Title, Text } = Typography

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Title level={5}>Category</Title>
        <Select
          style={{ width: '100%' }}
          placeholder="All Categories"
          allowClear
          value={filters.category}
          onChange={(val) => onFilter({ category: val })}
          options={categories?.map(c => ({ label: c.name, value: c.slug }))}
        />
      </div>
      <div>
        <Title level={5}>Price Range</Title>
        <Slider
          range
          min={0}
          max={1000}
          defaultValue={[filters.min_price || 0, filters.max_price || 1000]}
          onChangeComplete={(val) => onFilter({ min_price: val[0], max_price: val[1] })}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">${filters.min_price || 0}</Text>
          <Text type="secondary">${filters.max_price || 1000}</Text>
        </div>
      </div>
      <div>
        <Checkbox
          checked={filters.in_stock}
          onChange={(e) => onFilter({ in_stock: e.target.checked })}
        >
          In Stock Only
        </Checkbox>
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
    navigate({
      to: '/products',
      search: (prev) => ({ ...prev, ...newFilter, page: 1 }),
    })
  }

  return (
    <div className="page-container section-gap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Products</Title>
        
        <div style={{ display: 'flex', gap: 16 }}>
          <Button icon={<FilterOutlined />} onClick={() => setMobileFilterOpen(true)} className="md:hidden">
            Filters
          </Button>
          
          <Select
            value={search.sort}
            style={{ width: 180 }}
            onChange={(val) => updateFilter({ sort: val })}
            options={[
              { label: 'Newest Arrivals', value: 'newest' },
              { label: 'Price: Low to High', value: 'price_asc' },
              { label: 'Price: High to Low', value: 'price_desc' },
              { label: 'Most Popular', value: 'popular' },
            ]}
          />
        </div>
      </div>

      <Row gutter={32}>
        {/* Desktop Sidebar Filters */}
        <Col xs={0} md={6} lg={5}>
          <div style={{ position: 'sticky', top: 88 }}>
            <FilterPanel filters={search} categories={categories} onFilter={updateFilter} />
          </div>
        </Col>

        {/* Product Grid */}
        <Col xs={24} md={18} lg={19}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
          ) : productsData?.data.length === 0 ? (
            <Empty description="No products found matching your criteria" />
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {productsData?.data.map((product) => (
                  <Col xs={24} sm={12} lg={8} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>

              <div style={{ marginTop: 40, textAlign: 'center' }}>
                <Pagination
                  current={productsData?.meta.current_page}
                  total={productsData?.meta.total}
                  pageSize={productsData?.meta.per_page}
                  onChange={(page) => navigate({ to: '/products', search: (prev) => ({ ...prev, page }) })}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </Col>
      </Row>

      {/* Mobile Filter Drawer */}
      <Drawer
        title="Filters"
        placement="right"
        onClose={() => setMobileFilterOpen(false)}
        open={mobileFilterOpen}
      >
        <FilterPanel filters={search} categories={categories} onFilter={updateFilter} />
      </Drawer>
    </div>
  )
}
