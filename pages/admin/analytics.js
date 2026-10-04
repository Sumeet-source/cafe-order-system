import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IndianRupee, ClipboardList, CheckCircle2, ChefHat } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import AdminNav from '../../components/AdminNav';
import LogoutButton from '../../components/LogoutButton';

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

  if (loading) {
    return (
      <div className="admin-shell min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-white/90 animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  const cards = [
    { title: "Today's Revenue", value: `₹${stats.revenue}`, Icon: IndianRupee, bg: 'bg-emerald-500' },
    { title: 'Total Orders', value: stats.totalOrders, Icon: ClipboardList, bg: 'bg-emerald-500' },
    { title: 'Delivered', value: stats.delivered, Icon: CheckCircle2, bg: 'bg-emerald-500' },
    { title: 'In Progress', value: stats.preparing + stats.ready, Icon: ChefHat, bg: 'bg-emerald-500' },
  ];

  return (
    <div className="admin-shell min-h-screen bg-stone-950 relative overflow-x-hidden">

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="px-4 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="House Bird Cafe" className="w-10 h-10 rounded-full bg-white/90 p-0.5 flex-shrink-0 ring-2 ring-white/20" />
            <h1 className="text-base sm:text-xl font-serif font-bold text-white truncate">
              <span className="hidden sm:inline">House Bird Cafe · Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <AdminNav />
      </header>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">Today's Performance</h1>
          <p className="text-white/60 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {cards.map((card, i) => {
            const Icon = card.Icon;
            return (
              <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <Icon size={22} strokeWidth={2.2} className="text-white" />
                </div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wide mt-3">{card.title}</p>
                <p className="text-white font-bold text-2xl md:text-3xl mt-1">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-5">Order Status Breakdown</h2>
            <div className="space-y-4">
              {[
                { label: 'New Orders', count: stats.placed, color: 'bg-emerald-500' },
                { label: 'Preparing', count: stats.preparing, color: 'bg-emerald-500' },
                { label: 'Ready to Serve', count: stats.ready, color: 'bg-emerald-500' },
                { label: 'Delivered', count: stats.delivered, color: 'bg-emerald-500' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-medium text-white/80 text-sm">{item.label}</span>
                    <span className="font-bold text-white text-sm">{item.count}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full ${item.color} transition-all duration-500`} style={{ width: `${stats.totalOrders > 0 ? (item.count / stats.totalOrders) * 100 : 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-5">🔥 Top Selling Today</h2>
            {stats.topItems.length === 0 ? (
              <p className="text-white/40 italic text-center py-8">No orders yet today</p>
            ) : (
              <ul className="space-y-3">
                {stats.topItems.map((item, i) => (
                  <li key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70'}`}>#{i + 1}</span>
                      <span className="font-medium text-white truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-emerald-300 bg-emerald-400/20 border border-emerald-300/30 px-3 py-1 rounded-full text-xs flex-shrink-0">{item.count} sold</span>
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