import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

const STATUS_STYLE = {
  PLACED:    { bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/30',   label: 'Placed' },
  PREPARING: { bg: 'bg-blue-500/15',    text: 'text-blue-300',    border: 'border-blue-500/30',    label: 'Preparing' },
  READY:     { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', label: 'Ready' },
  DELIVERED: { bg: 'bg-[#1e2535]',      text: 'text-[#8891a8]',   border: 'border-[#1e2535]',      label: 'Delivered' },
  CANCELLED: { bg: 'bg-red-500/15',     text: 'text-red-300',     border: 'border-red-500/30',     label: 'Cancelled' },
};

const NEXT_STATUS = {
  PLACED: { next: 'PREPARING', label: 'Start Preparing' },
  PREPARING: { next: 'READY', label: 'Mark Ready' },
  READY: { next: 'DELIVERED', label: 'Mark Delivered' },
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState('PLACED');
  const lastWaiterCount = useRef(0);
  const audioCtx = useRef(null);

  const beep = () => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const fetchAll = async () => {
    const res = await fetch('/api/orders/stats');
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    setStats(data);

    const res2 = await fetch('/api/waiter-call');
    if (res2.ok) {
      const calls = await res2.json();
      if (calls.length > lastWaiterCount.current && lastWaiterCount.current !== 0) beep();
      lastWaiterCount.current = calls.length;
      setWaiterCalls(calls);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 5000);
    return () => clearInterval(t);
  }, []);

  const updateStatus = async (id, next) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: next }),
    });
    fetchAll();
  };

  const resolveWaiterCall = async (id) => {
    await fetch('/api/waiter-call', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  };

  if (loading || !stats) {
    return (
      <AdminLayout active="/admin/dashboard">
        <div className="flex items-center justify-center h-96">
          <p className="text-[#8891a8] animate-pulse">Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  // Active orders (for kanban columns)
  const activeOrders = stats.recentOrders.filter(o =>
    ['PLACED', 'PREPARING', 'READY'].includes(o.orderStatus)
  );
  const grouped = { PLACED: [], PREPARING: [], READY: [] };
  activeOrders.forEach(o => { if (grouped[o.orderStatus]) grouped[o.orderStatus].push(o); });

  // Hourly chart data — only show 8am to 11pm
  const hourly = stats.hourly.slice(8, 24);
  const maxHourly = Math.max(...hourly, 1);
  const hourLabels = ['8', '9', '10', '11', '12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

  // Stat cards
  const statCards = [
    {
      label: "Today's Revenue",
      value: `₹${stats.revenue}`,
      trend: stats.trends.revenue,
      icon: '💰',
      accent: 'from-[#4ade80] to-[#10b981]',
    },
    {
      label: "Today's Orders",
      value: stats.totalOrders,
      trend: stats.trends.orders,
      icon: '📋',
      accent: 'from-[#60a5fa] to-[#3b82f6]',
    },
    {
      label: 'Customers',
      value: stats.uniqueCustomers,
      trend: 0,
      icon: '👥',
      accent: 'from-[#a78bfa] to-[#8b5cf6]',
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      trend: 0,
      icon: '✕',
      accent: 'from-[#f87171] to-[#ef4444]',
    },
  ];

  return (
    <AdminLayout active="/admin/dashboard">
      {/* Waiter calls banner */}
      {waiterCalls.length > 0 && (
        <div className="mb-5 bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-4">
          <h2 className="font-bold text-red-300 text-base mb-3 flex items-center gap-2">
            🔔 Waiter Calls
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {waiterCalls.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {waiterCalls.map(call => (
              <div key={call._id} className="bg-[#141824] border border-red-500/40 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                <span className="text-2xl">
                  {call.callType === 'WATER' ? '💧' : call.callType === 'BILL' ? '🧾' : '🛎️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Table {call.tableNumber}</p>
                  <p className="text-xs text-[#8891a8]">
                    {call.callType === 'WATER' ? 'Water' : call.callType === 'BILL' ? 'Bill' : 'Assistance'}
                  </p>
                </div>
                <button
                  onClick={() => resolveWaiterCall(call._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        {statCards.map((card, i) => (
          <div key={i} className="bg-[#141824] border border-[#1e2535] rounded-2xl p-4 hover:border-[#2a3348] transition">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-lg shadow-lg`}>
                {card.icon}
              </div>
              {card.trend !== 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  card.trend > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {card.trend > 0 ? '↑' : '↓'} {Math.abs(card.trend)}%
                </span>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-wide text-[#8891a8] font-bold">{card.label}</p>
            <p className="text-2xl md:text-3xl font-bold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 mb-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#141824] border border-[#1e2535] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-bold text-white text-base">Hourly Orders</h2>
              <p className="text-xs text-[#8891a8] mt-0.5">Orders placed per hour today</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1 h-48 md:h-56">
            {hourly.map((count, i) => {
              const height = (count / maxHourly) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full h-full flex items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#10b981]/40 to-[#4ade80] transition-all hover:from-[#10b981] hover:to-[#86efac]"
                      style={{ height: `${Math.max(height, 3)}%` }}
                    >
                      {count > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#4ade80] opacity-0 group-hover:opacity-100 transition">
                          {count}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] md:text-[10px] text-[#6b7280] font-medium">{hourLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trending items */}
        <div className="bg-[#141824] border border-[#1e2535] rounded-2xl p-5">
          <h2 className="font-bold text-white text-base mb-4">Daily Trending</h2>
          {stats.topItems.length === 0 ? (
            <p className="text-xs text-[#8891a8] italic text-center py-8">No orders yet today</p>
          ) : (
            <ul className="space-y-3">
              {stats.topItems.map((item, i) => (
                <li key={i} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1e2535] to-[#252c40] flex items-center justify-center text-xs font-bold text-[#4ade80] flex-shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-[#8891a8]">Order #{1000 + i}</p>
                  </div>
                  <span className="text-sm font-bold text-white flex-shrink-0">{item.count}×</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Active orders */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-white text-base">Live Orders</h2>
          <span className="text-xs text-[#8891a8]">{activeOrders.length} active</span>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden bg-[#141824] border border-[#1e2535] rounded-xl p-1 flex mb-4">
          {['PLACED', 'PREPARING', 'READY'].map(status => (
            <button
              key={status}
              onClick={() => setMobileTab(status)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                mobileTab === status ? 'bg-[#4ade80] text-black' : 'text-[#8891a8]'
              }`}
            >
              {STATUS_STYLE[status].label} ({grouped[status].length})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['PLACED', 'PREPARING', 'READY'].map(status => (
            <div key={status} className={`${mobileTab === status ? 'block' : 'hidden'} md:block`}>
              <p className="hidden md:block text-xs font-bold text-[#8891a8] uppercase tracking-wider mb-2 px-1">
                {STATUS_STYLE[status].label} · {grouped[status].length}
              </p>
              <div className="space-y-3">
                {grouped[status].map(order => (
                  <div key={order._id} className="bg-[#141824] border border-[#1e2535] rounded-2xl p-4 hover:border-[#2a3348] transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-white">Table {order.tableNumber}</p>
                        <p className="text-xs text-[#8891a8]">👤 {order.customerName}</p>
                      </div>
                      <span className="text-[10px] text-[#6b7280]">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <ul className="space-y-1 mb-3 text-xs">
                      {order.items.slice(0, 4).map((it, i) => (
                        <li key={i} className="flex justify-between text-[#b8bfd0]">
                          <span><span className="text-[#4ade80] font-bold">{it.quantity}×</span> {it.name}</span>
                          <span>₹{it.price * it.quantity}</span>
                        </li>
                      ))}
                      {order.items.length > 4 && (
                        <li className="text-[10px] text-[#6b7280] italic">+{order.items.length - 4} more</li>
                      )}
                    </ul>
                    <div className="flex justify-between items-center pt-3 border-t border-[#1e2535] mb-3">
                      <span className="text-xs text-[#8891a8]">Total</span>
                      <span className="font-bold text-white">₹{order.totalAmount}</span>
                    </div>
                    {NEXT_STATUS[order.orderStatus] && (
                      <button
                        onClick={() => updateStatus(order._id, NEXT_STATUS[order.orderStatus].next)}
                        className="w-full bg-[#4ade80] hover:bg-[#86efac] text-black py-2.5 rounded-xl font-bold text-sm transition active:scale-95"
                      >
                        {NEXT_STATUS[order.orderStatus].label}
                      </button>
                    )}
                  </div>
                ))}
                {grouped[status].length === 0 && (
                  <div className="border-2 border-dashed border-[#1e2535] rounded-2xl p-6 text-center">
                    <p className="text-xs text-[#6b7280]">No orders</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-[#141824] border border-[#1e2535] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#1e2535] flex justify-between items-center">
          <h2 className="font-bold text-white text-base">Recent Orders</h2>
          <a href="/admin/history" className="text-xs text-[#4ade80] hover:underline font-medium">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0f1420]">
              <tr className="text-left text-[10px] uppercase tracking-wider text-[#8891a8]">
                <th className="p-3 font-bold">Order</th>
                <th className="p-3 font-bold">Date</th>
                <th className="p-3 font-bold">Customer</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2535]">
              {stats.recentOrders.map(order => {
                const s = STATUS_STYLE[order.orderStatus] || STATUS_STYLE.DELIVERED;
                return (
                  <tr key={order._id} className="hover:bg-[#1a1f2e] transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e2535] to-[#252c40] flex items-center justify-center text-[10px] font-bold text-[#4ade80]">
                          T{order.tableNumber}
                        </div>
                        <span className="font-medium text-white text-xs">#{order._id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-[#8891a8] whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="p-3 text-xs text-[#b8bfd0]">{order.customerName}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${s.bg} ${s.text} ${s.border}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-white text-sm">₹{order.totalAmount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
