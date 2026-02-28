import { Link } from '@tanstack/react-router'
import { Github, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const FOOTER_LINKS = {
  shop: [
    { label: 'All Products',   to: '/products' },
    { label: 'New Arrivals',   to: '/products' },
    { label: 'Best Sellers',   to: '/products' },
    { label: 'In Stock',       to: '/products' },
  ],
  account: [
    { label: 'Sign In',        to: '/auth/login' },
    { label: 'Create Account', to: '/auth/register' },
    { label: 'My Orders',      to: '/orders' },
    { label: 'Track Order',    to: '/track' },
  ],
  support: [
    { label: 'Help Center',    to: '/' },
    { label: 'Returns Policy', to: '/' },
    { label: 'Privacy Policy', to: '/' },
    { label: 'Terms of Use',   to: '/' },
  ],
}

const SOCIALS = [
  { icon: <Github className="h-4 w-4" />, label: 'GitHub' },
  { icon: <Twitter className="h-4 w-4" />, label: 'Twitter' },
  { icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
  { icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn' },
]

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-auto relative overflow-hidden" role="contentinfo">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="no-underline inline-flex items-center gap-2 mb-4">
              <span className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30">🛍️</span>
              <span className="text-xl font-extrabold text-slate-100 tracking-tight">
                Lara<span className="text-indigo-400">com</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-5 max-w-[260px]">
              Your one-stop destination for quality products at unbeatable prices. Shop with confidence.
            </p>

            <div className="space-y-2 text-sm">
              <a href="mailto:support@laracom.com" className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors no-underline">
                <Mail className="h-3.5 w-3.5 shrink-0" /> support@laracom.com
              </a>
              <a href="tel:+15551234567" className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors no-underline">
                <Phone className="h-3.5 w-3.5 shrink-0" /> +1 (555) 123-4567
              </a>
              <p className="flex items-center gap-2 text-slate-500 m-0">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> 123 Commerce St, NY
              </p>
            </div>

            <div className="flex gap-2 mt-5">
              {SOCIALS.map(({ icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors duration-200 border-0 cursor-pointer"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-slate-200 font-semibold text-sm uppercase tracking-widest mb-4">Shop</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {FOOTER_LINKS.shop.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to as '/products'} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors no-underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-slate-200 font-semibold text-sm uppercase tracking-widest mb-4">Account</h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {FOOTER_LINKS.account.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to as '/auth/login'} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors no-underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-slate-200 font-semibold text-sm uppercase tracking-widest mb-4">Newsletter</h4>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Subscribe for exclusive deals, new arrivals, and more.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault() }}
            >
              <Input
                type="email"
                placeholder="your@email.com"
                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm focus-visible:ring-indigo-500"
              />
              <Button type="submit" size="sm" className="shrink-0">Subscribe</Button>
            </form>

            <div className="mt-6">
              <h4 className="text-slate-200 font-semibold text-sm uppercase tracking-widest mb-3">Support</h4>
              <ul className="space-y-2 list-none p-0 m-0">
                {FOOTER_LINKS.support.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to as '/'} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors no-underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p className="m-0">© {new Date().getFullYear()} Laracom. All rights reserved.</p>
          <p className="m-0 flex items-center gap-1">
            Made with <Heart className="h-3 w-3 fill-red-500 text-red-500" /> by the Laracom team
          </p>
        </div>
      </div>
    </footer>
  )
}
