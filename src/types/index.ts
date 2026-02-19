// TypeScript interfaces for the Laracom eCommerce API

// ─── Generic API Response ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'customer' | 'admin'
  is_active: boolean
  email_verified_at?: string
  created_at?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
}

export interface OtpPayload {
  email: string
  otp: string
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  is_active?: boolean
  sort_order?: number
  parent_id?: string
  parent?: Category
  children?: Category[]
  products_count?: number
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  sku?: string
  options?: Record<string, string>
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  short_description?: string
  price: number
  compare_price?: number
  discount_percentage?: number
  sku?: string
  stock: number
  in_stock: boolean
  images: string[]
  is_active: boolean
  is_featured: boolean
  avg_rating?: number
  review_count?: number
  category?: Category
  variants?: ProductVariant[]
  meta?: Record<string, string>
}

export interface ProductFilters {
  search?: string
  category?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
  per_page?: number
  page?: number
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
  }
  variant?: {
    id: string
    name: string
    price: number
  } | null
}

export interface Cart {
  id: string | null
  items: CartItem[]
  total: number
  item_count: number
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface ShippingAddress {
  name: string
  phone: string
  address: string
  city: string
  country: string
}

export interface OrderItem {
  id: string
  product_name: string
  variant_name?: string
  sku?: string
  quantity: number
  unit_price: number
  total_price: number
  product_snapshot?: Record<string, unknown>
}

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  tax: number
  shipping_cost: number
  discount: number
  total: number
  shipping_address: ShippingAddress
  billing_address?: ShippingAddress
  notes?: string
  payment_method?: string
  payment_status: PaymentStatus
  tracking_number?: string
  guest_email?: string
  can_cancel: boolean
  user?: { id: string; name: string; email: string }
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface CheckoutPayload {
  shipping_address: ShippingAddress
  billing_address?: ShippingAddress
  notes?: string
  payment_method?: string
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string
  rating: number
  title?: string
  body?: string
  is_verified_purchase: boolean
  helpful_count: number
  user?: { id: string; name: string }
  created_at: string
}

export interface ReviewStats {
  total: number
  average: number
  breakdown: Record<number, number>
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface OrderStats {
  total_orders: number
  total_revenue: number
  pending: number
  confirmed: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  today_orders: number
  today_revenue: number
}

export interface UserStats {
  total_users: number
  total_customers: number
  total_admins: number
  active_users: number
  new_today: number
  new_this_month: number
}

export interface InventoryStats {
  total_products: number
  active_products: number
  out_of_stock: number
  low_stock: number
  total_stock_value: number
  variants_out_of_stock: number
}
