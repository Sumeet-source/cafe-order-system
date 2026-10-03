import { useState } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/history', label: 'Orders', icon: '📋' },
  { href: '/admin/menu', label: 'Menu', icon: '🍽️' },
  { href: '/admin/feedback', label: 'Reviews', icon: '⭐' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/tables', label: 'QR Codes', icon: '🔳' },
];

export default function AdminLayout({ children, active }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const NavContent = () => (
    <>
      <div className="p-5 border-b border-[#1e2535] flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full bg-white p-0.5" />
        <div>
          <p className="font-bold text-sm">House Bird</p>
          <p className="text-[10px] text-[#8891a8]">Cafe Admin</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-[#4ade80]/10 text-[#4ade80] border-l-2 border-[#4ade80] font-semibold'
                  : 'text-[#8891a8] hover:text-white hover:bg-[#1e2535] font-medium'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[#1e2535]">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8891a8] hover:text-red-400 hover:bg-red-500/10 transition font-medium"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#e8eaf0]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0f1420] border-r border-[#1e2535] fixed h-full top-0 left-0 z-30">
        <NavContent />
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-[#1e2535]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden text-2xl text-[#8891a8] hover:text-white"
              >
                ☰
              </button>
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold text-white">Hello, Owner 👋</h1>
                <p className="text-xs text-[#8891a8]">Welcome back to House Bird Cafe</p>
              </div>
              <div className="lg:hidden flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full bg-white p-0.5" />
                <span className="font-bold text-sm">House Bird</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle className="bg-[#141824] border border-[#1e2535] text-[#8891a8] hover:text-white" />
              <div className="flex items-center gap-2 bg-[#141824] border border-[#1e2535] rounded-lg px-2 py-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4ade80] to-[#10b981] flex items-center justify-center text-xs font-bold text-black">
                  O
                </div>
                <span className="hidden sm:inline text-xs font-medium">Owner</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#0f1420] border-r border-[#1e2535] z-50 flex flex-col">
            <NavContent />
          </aside>
        </>
      )}
    </div>
  );
}
