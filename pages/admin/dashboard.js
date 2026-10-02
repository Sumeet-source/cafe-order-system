import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from '../../components/ThemeToggle';

const STATUS_FLOW = {
  PLACED:    { next: 'PREPARING', label: 'Start Preparing', glow: 'shadow-amber-500/50',   gradient: 'from-amber-400 to-orange-500',   hover: 'hover:from-amber-300 hover:to-orange-400' },
  PREPARING: { next: 'READY',     label: 'Mark Ready',       glow: 'shadow-blue-500/50',    gradient: 'from-blue-400 to-indigo-500',    hover: 'hover:from-blue-300 hover:to-indigo-400' },
  READY:     { next: 'DELIVERED', label: 'Mark Delivered',   glow: 'shadow-emerald-500/50', gradient: 'from-emerald-400 to-teal-500',   hover: 'hover:from-emerald-300 hover:to-teal-400' },
};

const STATUS_LABEL = {
  PLACED: '🆕 New',
  PREPARING: '👨‍🍳 Preparing',
  READY: '✅ Ready',
};

const STATUS_ACCENT = {
  PLACED: 'from-amber-400 to-orange-500',
  PREPARING: 'from-blue-400 to-indigo-500',
  READY: 'from-emerald-400 to-teal-500',
};

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState('PLACED');
  const lastCount = useRef(0);
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

  const fetchOrders = async () => {
    const res = await fetch('/api/orders?status=PLACED');
    if (res.status === 401) { router.push('/admin/login'); return; }
    const placed = await res.json();

    const res2 = await fetch('/api/orders?status=PREPARING');
    const preparing = res2.ok ? await res2.json() : [];

    const res3 = await fetch('/api/orders?status=READY');
    const ready = res3.ok ? await res3.json() : [];

    const all = [...placed, ...preparing, ...ready];
    if (placed.length > lastCount.current && lastCount.current !== 0) beep();
    lastCount.current = placed.length;
    setOrders(all);

    const res4 = await fetch('/api/waiter-call');
    if (res4.ok) {
      const calls = await res4.json();
      if (calls.length > lastWaiterCount.current && lastWaiterCount.current !== 0) beep();
      lastWaiterCount.current = calls.length;
      setWaiterCalls(calls);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 5000);
    return () => clearInterval(t);
  }, []);

  const updateStatus = async (id, next) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: next }),
    });
    fetchOrders();
  };

  const resolveWaiterCall = async (id) => {
    await fetch('/api/waiter-call', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchOrders();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const grouped = { PLACED: [], PREPARING: [], READY: [] };
  orders.forEach((o) => { if (grouped[o.orderStatus]) grouped[o.orderStatus].push(o); });

  const totalOrders = grouped.PLACED.length + grouped.PREPARING.length + grouped.READY.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 relative overflow-x-hidden">
      {/* Ambient gradient blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-15 pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/2 w-[400px] h-[400px] bg-teal-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 pointer-events-none"></div>

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/5 border-b border-white/10">
        {/* Top row: Logo + Theme Toggle + Logout */}
        <div className="px-4 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/logo.png"
              alt="House Bird Cafe"
              className="w-10 h-10 rounded-full bg-white/90 p-0.5 flex-shrink-0 ring-2 ring-white/20 shadow-lg"
            />
            <h1 className="text-base sm:text-xl font-serif font-bold tracking-wide text-white truncate">
              <span className="hidden sm:inline">House Bird Cafe · Kitchen</span>
              <span className="sm:hidden">House Bird Cafe</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20" />
            <button
              onClick={logout}
              className="text-xs bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-white/20 shadow-lg shadow-red-500/30 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Nav links - horizontal scroll on mobile */}
        <nav className="flex gap-2 px-4 pb-3 overflow-x-auto">
          <a href="/admin/analytics" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">
            📊 Analytics
          </a>
          <a href="/admin/history" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">
            📅 History
          </a>
          <a href="/admin/feedback" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">
            ⭐ Feedback
          </a>
          <a href="/admin/menu" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">
            📋 Menu
          </a>
          <a href="/admin/tables" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition">
            🔳 QR Codes
          </a>
        </nav>
      </header>

      {/* ============ WAITER CALLS BANNER ============ */}
      {waiterCalls.length > 0 && (
        <div className="relative z-20 p-3 sm:p-4">
          <div className="max-w-7xl mx-auto bg-red-500/15 backdrop-blur-xl border-2 border-red-400/40 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-red-500/20">
            <h2 className="font-bold text-red-100 text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
              🔔 Waiter Calls
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-lg">
                {waiterCalls.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {waiterCalls.map((call) => (
                <div
                  key={call._id}
                  className="bg-white/10 backdrop-blur-md border border-red-300/40 rounded-xl p-3 flex items-center gap-3 shadow-lg animate-pulse"
                >
                  <div className="text-3xl flex-shrink-0">
                    {call.callType === 'WATER' ? '💧' : call.callType === 'BILL' ? '🧾' : '🛎️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">Table {call.tableNumber}</p>
                    <p className="text-xs text-red-100/80 truncate">
                      {call.callType === 'WATER' ? 'Bring Water' : call.callType === 'BILL' ? 'Get Bill' : 'Call Waiter'}
                    </p>
                    <p className="text-[10px] text-red-100/60">
                      {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveWaiterCall(call._id)}
                    className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-xs shadow-lg shadow-red-500/40 border border-white/20"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ MOBILE TABS (hidden on desktop) ============ */}
      {!loading && (
        <div className="md:hidden sticky top-[112px] z-20 px-3 pt-3">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-1 flex shadow-xl">
            {['PLACED', 'PREPARING', 'READY'].map((status) => {
              const isActive = mobileTab === status;
              return (
                <button
                  key={status}
                  onClick={() => setMobileTab(status)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition relative overflow-hidden ${
                    isActive
                      ? `bg-gradient-to-r ${STATUS_ACCENT[status]} text-white shadow-lg`
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{STATUS_LABEL[status]}</span>
                    {grouped[status].length > 0 && (
                      <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                        isActive ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70'
                      }`}>
                        {grouped[status].length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ LOADING ============ */}
      {loading ? (
        <div className="flex items-center justify-center h-96 relative z-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-6 shadow-2xl">
            <p className="text-lg text-white/90 animate-pulse">Loading orders...</p>
          </div>
        </div>
      ) : totalOrders === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 p-6 text-center relative z-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-8 py-10 shadow-2xl max-w-sm">
            <div className="text-6xl mb-4">☕</div>
            <p className="text-xl font-serif font-bold text-white">No active orders</p>
            <p className="text-sm text-white/60 mt-2">Orders will appear here in real-time</p>
          </div>
        </div>
      ) : (
        /* ============ ORDERS GRID ============ */
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-3 md:p-6 max-w-7xl mx-auto">
          {['PLACED', 'PREPARING', 'READY'].map((status) => (
            <div
              key={status}
              className={`flex flex-col ${
                mobileTab === status ? 'block' : 'hidden'
              } md:block`}
            >
              {/* Column header - hidden on mobile */}
              <div className="hidden md:flex justify-between items-center mb-4 px-2">
                <h2 className="font-bold text-lg text-white uppercase tracking-wider">
                  {status === 'PLACED' ? '🆕 New Orders' : status === 'PREPARING' ? '👨‍🍳 Preparing' : '✅ Ready to Serve'}
                </h2>
                <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                  {grouped[status].length}
                </span>
              </div>

              {/* Orders list */}
              <div className="space-y-3 md:space-y-4 flex-1">
                {grouped[status].map((order) => (
                  <div
                    key={order._id}
                    className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden group hover:bg-white/15 transition"
                  >
                    {/* Colored top accent bar */}
                    <div className={`h-1 bg-gradient-to-r ${STATUS_ACCENT[order.orderStatus]}`}></div>

                    {/* Order header */}
                    <div className="p-3 md:p-4 flex justify-between items-center border-b border-white/10">
                      <span className="font-extrabold text-lg md:text-xl text-white">
                        Table {order.tableNumber}
                      </span>
                      <span className="text-xs md:text-sm font-medium text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Order body */}
                    <div className="p-3 md:p-4">
                      <p className="text-xs md:text-sm font-medium text-white/70 mb-2 md:mb-3 flex items-center gap-2">
                        <span className="text-base md:text-lg">👤</span>
                        <span className="truncate">{order.customerName}</span>
                      </p>
                      <ul className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                        {order.items.map((it, i) => (
                          <li key={i} className="flex justify-between text-white text-sm md:text-base font-medium gap-2">
                            <span className="flex items-center gap-1.5 md:gap-2 min-w-0">
                              <span className="bg-emerald-400/30 text-emerald-100 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded border border-emerald-300/30 flex-shrink-0">
                                {it.quantity}x
                              </span>
                              <span className="truncate">{it.name}</span>
                            </span>
                            <span className="text-white/70 flex-shrink-0">₹{it.price * it.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between items-center border-t border-white/10 pt-2 md:pt-3">
                        <span className="font-bold text-white/70 text-sm md:text-base">Total</span>
                        <span className="font-extrabold text-xl md:text-2xl text-white drop-shadow-lg">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    {STATUS_FLOW[order.orderStatus] && (
                      <div className="p-3 md:p-4">
                        <button
                          onClick={() => updateStatus(order._id, STATUS_FLOW[order.orderStatus].next)}
                          className={`w-full text-white py-3 md:py-3.5 rounded-xl font-bold text-base md:text-lg shadow-xl transition-all duration-200 transform active:scale-95 bg-gradient-to-r ${STATUS_FLOW[order.orderStatus].gradient} ${STATUS_FLOW[order.orderStatus].hover} ${STATUS_FLOW[order.orderStatus].glow}`}
                        >
                          {STATUS_FLOW[order.orderStatus].label}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {grouped[status].length === 0 && (
                  <div className="bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-2xl p-6 md:p-8 text-center text-white/40 text-sm">
                    No orders in {STATUS_LABEL[status]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom padding for mobile */}
      <div className="h-8"></div>
    </div>
  );
}
