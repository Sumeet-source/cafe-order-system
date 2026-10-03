import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Download, BarChart3, Filter, LogOut } from 'lucide-react';
import AdminNav from '../../components/AdminNav';
import LogoutButton from '../../components/LogoutButton';
import ThemeToggle from '../../components/ThemeToggle';

export default function OrderHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [from, setFrom] = useState(new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('ALL');
  const [table, setTable] = useState('ALL');

  const fetchHistory = async () => {
    setLoading(true);
    const params = new URLSearchParams({ from, to, status, table });
    const res = await fetch(`/api/orders/history?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    setOrders(data.orders || []);
    setTotalRevenue(data.totalRevenue || 0);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); /* eslint-disable-next-line */ }, []);

  const applyFilters = (e) => { e.preventDefault(); fetchHistory(); };

  const quickRange = (days) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - days);
    setFrom(past.toISOString().split('T')[0]);
    setTo(today.toISOString().split('T')[0]);
    setTimeout(fetchHistory, 100);
  };

  const downloadCSV = (type) => {
    setDownloading(true);
    const params = new URLSearchParams({ from, to, status, table, export: type });
    const a = document.createElement('a');
    a.href = `/api/orders/history?${params}`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 1500);
  };

  const statusStyle = (s) => ({
    PLACED: 'bg-amber-400/20 text-amber-200 border-amber-300/30',
    PREPARING: 'bg-blue-400/20 text-blue-200 border-blue-300/30',
    READY: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30',
    DELIVERED: 'bg-white/10 text-white/70 border-white/20',
    CANCELLED: 'bg-red-400/20 text-red-200 border-red-300/30',
  }[s] || 'bg-white/10 text-white/70 border-white/20');

  const inputClass = "w-full max-w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none";
  const labelClass = "block text-[10px] font-bold text-white/60 uppercase tracking-wide mb-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 relative overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-15 pointer-events-none"></div>

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="px-4 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="House Bird Cafe" className="w-10 h-10 rounded-full bg-white/90 p-0.5 flex-shrink-0 ring-2 ring-white/20" />
            <h1 className="text-base sm:text-xl font-serif font-bold text-white truncate">
              <span className="hidden sm:inline">House Bird Cafe · History</span>
              <span className="sm:hidden">History</span>
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
        {/* Filters */}
        <form onSubmit={applyFilters} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-5 mb-5">
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-3 md:mb-3">
            <div className="w-full overflow-hidden">
              <label className={labelClass}>From Date</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
            </div>
            <div className="w-full overflow-hidden">
              <label className={labelClass}>To Date</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
            </div>
            <div className="w-full md:flex md:items-end">
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <Filter size={16} strokeWidth={2.5} />
                Apply Filters
              </button>
            </div>
          </div>

          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3 md:mb-3 mt-3 md:mt-0">
            <div className="w-full overflow-hidden">
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                <option value="ALL">All Statuses</option>
                <option value="PLACED">Placed</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="w-full overflow-hidden">
              <label className={labelClass}>Table</label>
              <select value={table} onChange={(e) => setTable(e.target.value)} className={inputClass}>
                <option value="ALL">All Tables</option>
                {[...Array(20)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Table {i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-white/10">
            <span className="text-[10px] font-bold text-white/50 py-1 uppercase">Quick:</span>
            {[{ l: 'Today', d: 0 }, { l: 'Yesterday', d: 1 }, { l: 'Last 7 Days', d: 7 }, { l: 'Last 30 Days', d: 30 }].map((q) => (
              <button key={q.l} type="button" onClick={() => quickRange(q.d)} className="text-[11px] bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-full text-white font-medium transition-colors">
                {q.l}
              </button>
            ))}
          </div>
        </form>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-white/60 uppercase">Orders</p>
            <p className="text-2xl md:text-3xl font-bold text-white mt-1">{orders.length}</p>
          </div>
          <div className="bg-emerald-600 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-white/90 uppercase">Revenue</p>
            <p className="text-2xl md:text-3xl font-bold text-white mt-1">₹{totalRevenue}</p>
          </div>
          <button
            onClick={() => downloadCSV('csv')}
            disabled={downloading || orders.length === 0}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 disabled:opacity-50 text-left transition-colors flex flex-col items-start"
          >
            <Download size={22} strokeWidth={2.2} className="text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-white">{downloading ? 'Downloading...' : 'Full Orders'}</p>
            <p className="text-[10px] text-white/50">CSV</p>
          </button>
          <button
            onClick={() => downloadCSV('summary')}
            disabled={downloading || orders.length === 0}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 disabled:opacity-50 text-left transition-colors flex flex-col items-start"
          >
            <BarChart3 size={22} strokeWidth={2.2} className="text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-white">{downloading ? 'Downloading...' : 'Summary'}</p>
            <p className="text-[10px] text-white/50">CSV</p>
          </button>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
            <p className="text-white/80 animate-pulse">Loading...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-12 text-center text-white/50">
            No orders found for this period
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-left text-white/70 text-xs uppercase tracking-wide">
                    <th className="p-3 font-bold">Time</th>
                    <th className="p-3 font-bold">Table</th>
                    <th className="p-3 font-bold">Customer</th>
                    <th className="p-3 font-bold">Items</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((o) => (
                    <tr key={o._id} className="text-white hover:bg-white/5 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-sm">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        <div className="text-[10px] text-white/50">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="p-3 font-bold">T{o.tableNumber}</td>
                      <td className="p-3 text-white/80">{o.customerName}</td>
                      <td className="p-3 text-xs text-white/70">
                        {o.items.map((it, i) => (<div key={i}>{it.quantity}× {it.name}</div>))}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusStyle(o.orderStatus)}`}>{o.orderStatus}</span>
                      </td>
                      <td className="p-3 text-right font-bold">₹{o.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {orders.map((o) => (
                <div key={o._id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
                  <div className="flex justify-between items-center p-3 border-b border-white/10">
                    <span className="font-extrabold text-white">Table {o.tableNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusStyle(o.orderStatus)}`}>{o.orderStatus}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between text-xs text-white/60">
                      <span>👤 {o.customerName}</span>
                      <span>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <ul className="space-y-1">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex justify-between text-sm text-white">
                          <span><span className="text-emerald-300 font-bold">{it.quantity}×</span> {it.name}</span>
                          <span className="text-white/70">₹{it.price * it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-white/60 text-xs font-bold">TOTAL</span>
                      <span className="text-white font-extrabold text-lg">₹{o.totalAmount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}