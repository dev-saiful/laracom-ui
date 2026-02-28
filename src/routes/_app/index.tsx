import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Truck, ShieldCheck, Headphones, Zap, Star, ArrowRight, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/api/products'
import ProductCard from '@/components/shared/ProductCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/')({
  component: HomePage,
})

/* ─── Static data ──────────────────────────────────────────────────────────── */

const TRUST_ITEMS = [
  { Icon: Truck,       label: 'Free Shipping',   desc: 'On orders over $50' },
  { Icon: ShieldCheck, label: 'Secure Payments', desc: '256-bit SSL encryption' },
  { Icon: Headphones,  label: '24/7 Support',    desc: "We're always here" },
  { Icon: Zap,         label: 'Fast Delivery',   desc: '2–3 business days' },
]

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '💻', clothing: '👗', shoes: '👟', furniture: '🛋️',
  books: '📚', sports: '⚽', beauty: '💄', toys: '🧸',
  food: '🍔', garden: '🌱', default: '🏷️',
}
const getCategoryIcon = (slug: string) =>
  CATEGORY_ICONS[slug.toLowerCase()] ?? CATEGORY_ICONS['default']

const CATEGORY_COLORS = [
  'bg-violet-50 text-violet-700 hover:bg-violet-100',
  'bg-sky-50    text-sky-700    hover:bg-sky-100',
  'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  'bg-amber-50  text-amber-700  hover:bg-amber-100',
  'bg-rose-50   text-rose-700   hover:bg-rose-100',
  'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
]

const FEATURES = [
  { icon: '🛡️', bg: 'bg-indigo-50',  title: 'Buyer Protection',  desc: 'Money-back guarantee on every order.' },
  { icon: '🚀', bg: 'bg-emerald-50', title: 'Lightning Fast',    desc: 'Optimized from browse to checkout.' },
  { icon: '💎', bg: 'bg-amber-50',   title: 'Premium Quality',   desc: 'Every product is vetted by our team.' },
  { icon: '🔄', bg: 'bg-rose-50',    title: 'Easy Returns',      desc: 'Hassle-free returns within 30 days.' },
]

/* ─── Component ─────────────────────────────────────────────────────────────── */

function HomePage() {
  const navigate = useNavigate()

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.featured().then((r) => r.data.data),
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data.data),
  })

  return (
    <div className="bg-white">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        aria-label="Welcome banner"
        className="relative overflow-hidden bg-slate-950 flex items-center min-h-[580px]"
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-purple-600/15 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-sky-600/10 blur-[100px]" />
        </div>

        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-medium mb-7 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            New Season Sale — Up to 50% Off
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Shop what you<br />
            <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              truly love
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed mb-10">
            Curated collections of premium products delivered to your door.
            Quality you can trust, prices you'll celebrate.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-14">
            <Button
              size="lg"
              className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xl shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02]"
              onClick={() => navigate({ to: '/products' })}
            >
              Shop Now <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 rounded-xl border-white/15 text-white bg-white/5 hover:bg-white/10 font-medium backdrop-blur-sm transition-all duration-200"
              onClick={() => navigate({ to: '/products', search: { sort: 'newest' } })}
            >
              New Arrivals
            </Button>
          </div>

          {/* Social proof stats */}
          <div className="flex justify-center gap-10 sm:gap-16 flex-wrap">
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '10K+', label: 'Products Listed' },
              { value: '4.9',  label: 'Avg Rating', star: true },
              { value: '99%',  label: 'Satisfaction' },
            ].map(({ value, label, star }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                  {star && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                  {value}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {TRUST_ITEMS.map(({ Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 py-5 px-4 sm:px-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* CATEGORIES */}
        <section aria-label="Product categories">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Browse</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Shop by Category</h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors no-underline"
            >
              All Categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories?.slice(0, 12).map((cat, i) => (
                <Link
                  key={cat.id}
                  to="/products"
                  search={{ category: cat.slug }}
                  aria-label={`Browse ${cat.name}`}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl text-center cursor-pointer',
                    'transition-all duration-200 hover:scale-[1.04] hover:shadow-md no-underline',
                    CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                  )}
                >
                  <div className="text-2xl leading-none">{getCategoryIcon(cat.slug)}</div>
                  <span className="text-xs font-bold leading-tight">{cat.name}</span>
                  {cat.products_count !== undefined && (
                    <span className="text-[10px] opacity-60 font-medium">{cat.products_count} items</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* FEATURED PRODUCTS */}
        <section aria-label="Featured products">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Handpicked</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Featured Products</h2>
            </div>
            <button
              onClick={() => navigate({ to: '/products' })}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : (featured?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🛍️</div>
              <p className="text-slate-400 text-sm">No featured products yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featured?.map((product, i) => (
                <div
                  key={product.id}
                  style={{ animation: `fadeInUp 0.4s ease ${i * 0.07}s both` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PROMO BANNERS */}
        <section aria-label="Promotions" className="grid md:grid-cols-2 gap-4">
          {/* Banner 1 */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 to-violet-700 p-8 sm:p-10 flex flex-col justify-between min-h-[200px] group">
            <div className="absolute -top-12 -right-12 w-52 h-52 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="relative">
              <span className="inline-block text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Limited Time</span>
              <h3 className="text-3xl font-black text-white leading-tight">
                Up to 50% Off<br />New Arrivals
              </h3>
            </div>
            <Button
              className="self-start relative bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-lg mt-6 transition-transform duration-200 hover:scale-[1.03]"
              onClick={() => navigate({ to: '/products', search: { sort: 'newest' } })}
            >
              Shop Now <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Banner 2 */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500 to-orange-600 p-8 sm:p-10 flex flex-col justify-between min-h-[200px] group">
            <div className="absolute -top-12 -right-12 w-52 h-52 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="relative">
              <span className="inline-block text-xs font-bold text-orange-100 uppercase tracking-widest mb-2">Members Only</span>
              <h3 className="text-3xl font-black text-white leading-tight">
                Free Shipping<br />On Every Order
              </h3>
            </div>
            <Button
              className="self-start relative bg-white text-orange-700 hover:bg-orange-50 font-bold rounded-xl shadow-lg mt-6 transition-transform duration-200 hover:scale-[1.03]"
              onClick={() => navigate({ to: '/auth/register' })}
            >
              Join Free <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </section>

        {/* WHY LARACOM */}
        <section aria-label="Why choose us">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Why Laracom</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Built around you</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
              Every feature we build puts your shopping experience first.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon, bg, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all duration-200"
              >
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4', bg)}>
                  {icon}
                </div>
                <h5 className="font-bold text-slate-900 text-sm mb-1.5">{title}</h5>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section aria-label="Call to action" className="pb-4">
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-16 text-center">
            {/* Glows */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/25 blur-[80px] rounded-full" />
            </div>
            {/* Content */}
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-5">
                <Sparkles className="w-3 h-3" /> Special offer
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white mb-3">
                Ready to start shopping?
              </h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                Join 50,000+ happy customers and get exclusive deals delivered to your inbox.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xl shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => navigate({ to: '/products' })}
                >
                  Browse Products
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 rounded-xl border-white/15 text-white bg-white/5 hover:bg-white/10 font-semibold"
                  onClick={() => navigate({ to: '/auth/register' })}
                >
                  Create Free Account
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
