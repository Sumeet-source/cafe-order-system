import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

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
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-xl text-stone-500 animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  const cards = [
    { title: "Today's Revenue", value: `₹${stats.revenue}`, icon: '💰', color: 'bg-emerald-500' },
    { title: 'Total Orders', value: stats.totalOrders, icon: '📋', color: 'bg-blue-500' },
    { title: 'Delivered', value: stats.delivered, icon: '✅', color: 'bg-green-600' },
    { title: 'Preparing Now', value: stats.preparing + stats.ready, icon: '👨‍🍳', color: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <header className="mb-8 max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-800">House Bird Cafe</h1>
          <p className="text-stone-500 text-sm mt-1">Today's Performance • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <a href="/admin/dashboard" className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-900 transition">← Back to Dashboard</a>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {cards.map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4 hover:shadow-md transition">
              <div className={`${card.color} text-white w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner`}>
                {card.icon}
              </div>
              <div>
                <p className="text-stone-500 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold text-stone-800 mt-1">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Status Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Order Status Breakdown</h2>
            <div className="space-y-4">
              {[
                { label: 'New Orders (Placed)', count: stats.placed, color: 'bg-yellow-500' },
                { label: 'Preparing', count: stats.preparing, color: 'bg-blue-500' },
                { label: 'Ready to Serve', count: stats.ready, color: 'bg-emerald-500' },
                { label: 'Delivered', count: stats.delivered, color: 'bg-stone-400' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-stone-700">{item.label}</span>
                    <span className="font-bold text-stone-800">{item.count}</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-3">
                    <div 
                      className={`${item.color} h-3 rounded-full transition-all duration-500`} 
                      style={{ width: `${stats.totalOrders > 0 ? (item.count / stats.totalOrders) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-6">🔥 Top Selling Items Today</h2>
            {stats.topItems.length === 0 ? (
              <p className="text-stone-400 italic text-center py-8">No orders yet today</p>
            ) : (
              <ul className="space-y-4">
                {stats.topItems.map((item, i) => (
                  <li key={i} className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-stone-200 text-stone-700' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        #{i + 1}
                      </span>
                      <span className="font-medium text-stone-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-sm">
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
