import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function OrderHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
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

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  const applyFilters = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const quickRange = (days) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - days);
    setFrom(past.toISOString().split('T')[0]);
    setTo(today.toISOString().split('T')[0]);
    setTimeout(fetchHistory, 100);
  };

  const statusColor = (s) => ({
    PLACED: 'bg-amber-100 text-amber-800',
    PREPARING: 'bg-blue-100 text-blue-800',
    READY: 'bg-emerald-100 text-emerald-800',
    DELIVERED: 'bg-stone-200 text-stone-700',
    CANCELLED: 'bg-red-100 text-red-800',
  }[s] || 'bg-stone-100 text-stone-700');

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <header className="mb-8 max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-800">Order History</h1>
          <p className="text-stone-500 text-sm mt-1">House Bird Cafe</p>
        </div>
        <a href="/admin/dashboard" className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-900 transition">← Back to Dashboard</a>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Filters */}
        <form onSubmit={applyFilters} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">From Date</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">To Date</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm">
                <option value="ALL">All Statuses</option>
                <option value="PLACED">Placed</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Table</label>
              <select value={table} onChange={(e) => setTable(e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm">
                <option value="ALL">All Tables</option>
                {[...Array(20)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Table {i + 1}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-emerald-700 text-white py-2 rounded-lg font-bold hover:bg-emerald-800 transition">
              Apply Filters
            </button>
          </div>

          {/* Quick Ranges */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
            <span className="text-xs font-bold text-stone-500 py-1">Quick:</span>
            <button type="button" onClick={() => quickRange(0)} className="text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-full font-medium">Today</button>
            <button type="button" onClick={() => quickRange(1)} className="text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-full font-medium">Yesterday</button>
            <button type="button" onClick={() => quickRange(7)} className="text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-full font-medium">Last 7 Days</button>
            <button type="button" onClick={() => quickRange(30)} className="text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-full font-medium">Last 30 Days</button>
          </div>
        </form>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
            <p className="text-xs font-bold text-stone-500 uppercase">Total Orders</p>
            <p className="text-3xl font-bold text-stone-800 mt-1">{orders.length}</p>
          </div>
          <div className="bg-emerald-600 p-5 rounded-xl shadow-sm text-white">
            <p className="text-xs font-bold text-emerald-100 uppercase">Total Revenue</p>
            <p className="text-3xl font-bold mt-1">₹{totalRevenue}</p>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <p className="text-center text-stone-500 py-10 animate-pulse">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-stone-400 border border-stone-200">
            No orders found for this period
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left p-3 font-bold text-stone-600">Time</th>
                    <th className="text-left p-3 font-bold text-stone-600">Table</th>
                    <th className="text-left p-3 font-bold text-stone-600">Customer</th>
                    <th className="text-left p-3 font-bold text-stone-600">Items</th>
                    <th className="text-left p-3 font-bold text-stone-600">Status</th>
                    <th className="text-right p-3 font-bold text-stone-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-stone-50 transition">
                      <td className="p-3 text-stone-500 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        <br />
                        <span className="text-xs">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="p-3 font-bold text-stone-800">Table {o.tableNumber}</td>
                      <td className="p-3 text-stone-700">{o.customerName}</td>
                      <td className="p-3 text-stone-600 text-xs">
                        {o.items.map((it, i) => (
                          <div key={i}>{it.quantity}× {it.name}</div>
                        ))}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor(o.orderStatus)}`}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-stone-800">₹{o.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
