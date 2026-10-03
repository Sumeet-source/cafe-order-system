import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from '../../components/ThemeToggle';

export default function Analytics() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/orders/stats');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-6">
          <p className="text-white/90 animate-pulse">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Today's Revenue", value: `₹${stats.revenue}`, icon: '💰', gradient: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/30' },
    { title: 'Total Orders', value: stats.totalOrders, icon: '📋', gradient: 'from-blue-400 to-indigo-500', glow: 'shadow-blue-500/30' },
    { title: 'Delivered', value: stats.delivered, icon: '✅', gradient: 'from-green-400 to-emerald-500', glow: 'shadow-green-500/30' },
    { title: 'In Progress', value: stats.preparing + stats.ready, icon: '👨‍🍳', gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 relative overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-15 pointer-events-none"></div>

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="px-4 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="House Bird Cafe" className="w-10 h-10 rounded-full bg-white/90 p-0.5 flex-shrink-0 ring-2 ring-white/20 shadow-lg" />
            <h1 className="text-base sm:text-xl font-serif font-bold text-white truncate">
              <span className="hidden sm:inline">House Bird Cafe · Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20" />
            <button onClick={logout} className="text-xs bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-white/20 shadow-lg shadow-red-500/30 transition font-medium">
              Logout
            </button>
          </div>
        </div>
        <nav className="flex gap-2 px-4 pb-3 overflow-x-auto md:justify-center">
          <a href="/admin/dashboard" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">🏠 Dashboard</a>
          <a href="/admin/history" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">📅 History</a>
          <a href="/admin/feedback" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">⭐ Feedback</a>
          <a href="/admin/menu" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">📋 Menu</a>
          <a href="/admin/tables" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">🔳 QR Codes</a>
        </nav>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">Today's Performance</h1>
          <p className="text-white/60 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-5 shadow-2xl hover:bg-white/15 transition">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.glow} mb-3`}>
                {card.icon}
              </div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide">{card.title}</p>
              <p className="text-white font-bold text-2xl md:text-3xl mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6 shadow-2xl">
            <h2 className="text-lg md:text-xl font-bold text-white mb-5">Order Status Breakdown</h2>
            <div className="space-y-4">
              {[
                { label: 'New Orders', count: stats.placed, gradient: 'from-amber-400 to-orange-500' },
                { label: 'Preparing', count: stats.preparing, gradient: 'from-blue-400 to-indigo-500' },
                { label: 'Ready to Serve', count: stats.ready, gradient: 'from-emerald-400 to-teal-500' },
                { label: 'Delivered', count: stats.delivered, gradient: 'from-stone-400 to-stone-500' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-medium text-white/80 text-sm">{item.label}</span>
                    <span className="font-bold text-white text-sm">{item.count}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-500`}
                      style={{ width: `${stats.totalOrders > 0 ? (item.count / stats.totalOrders) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6 shadow-2xl">
            <h2 className="text-lg md:text-xl font-bold text-white mb-5">🔥 Top Selling Today</h2>
            {stats.topItems.length === 0 ? (
              <p className="text-white/40 italic text-center py-8">No orders yet today</p>
            ) : (
              <ul className="space-y-3">
                {stats.topItems.map((item, i) => (
                  <li key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg shadow-amber-500/30' :
                        i === 1 ? 'bg-white/20 text-white' :
                        i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' :
                        'bg-white/10 text-white/60'
                      }`}>
                        #{i + 1}
                      </span>
                      <span className="font-medium text-white truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-emerald-300 bg-emerald-400/20 border border-emerald-300/30 px-3 py-1 rounded-full text-xs flex-shrink-0">
                      {item.count} sold
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
