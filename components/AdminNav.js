import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  BarChart3,
  History,
  Star,
  UtensilsCrossed,
  QrCode,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
  { href: '/admin/history',   label: 'History',   Icon: History },
  { href: '/admin/feedback',  label: 'Feedback',  Icon: Star },
  { href: '/admin/menu',      label: 'Menu',      Icon: UtensilsCrossed },
  { href: '/admin/tables',    label: 'QR Codes',  Icon: QrCode },
];

export default function AdminNav() {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <nav className="flex gap-2 px-4 pb-3 overflow-x-auto md:justify-center">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive = currentPath === href;
        return (
          <a
            key={href}
            href={href}
            className={`group flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-xl border transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/20 border-emerald-400/50 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white/10 backdrop-blur-md border-white/20 text-white/80 hover:bg-white/20 hover:text-white hover:border-white/30 hover:shadow-lg'
            }`}
          >
            <Icon
              size={16}
              strokeWidth={2.2}
              className={`transition-transform duration-200 ${
                isActive ? 'text-emerald-300' : 'text-white/70 group-hover:text-emerald-300 group-hover:scale-110'
              }`}
            />
            <span className="text-xs font-semibold tracking-wide">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}