import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const STATUS_FLOW = {
  PLACED:    { next: 'PREPARING', label: 'Start Preparing', color: 'bg-amber-500 hover:bg-amber-600' },
  PREPARING: { next: 'READY',     label: 'Mark Ready',       color: 'bg-blue-600 hover:bg-blue-700'   },
  READY:     { next: 'DELIVERED', label: 'Mark Delivered',   color: 'bg-emerald-600 hover:bg-emerald-700'  },
};

const STATUS_LABEL = {
  PLACED: '🆕 New',
  PREPARING: '👨‍🍳 Preparing',
  READY: '✅ Ready',
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
    <div className="min-h-screen bg-stone-100">
      {/* ============ HEADER ============ */}
      <header className="bg-stone-900 text-white shadow-lg sticky top-0 z-30">
        {/* Top row: Logo + Logout */}
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/logo.png"
              alt="House Bird Cafe"
              className="w-9 h-9 rounded-full bg-white p-0.5 flex-shrink-0"
            />
            <h1 className="text-base sm:text-xl font-serif font-bold tracking-wide truncate">
              <span className="hidden sm:inline">House Bird Cafe - Kitchen</span>
              <span className="sm:hidden">House Bird Cafe</span>
            </h1>
          </div>
          <button
            onClick={logout}
            className="flex-shrink-0 text-xs bg-red-600 px-3 py-2 rounded-md hover:bg-red-700 transition font-medium"
          >
            Logout
          </button>
        </div>

        {/* Nav links - horizontal scroll on mobile */}
        <nav className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-thin">
          <a href="/admin/analytics" className="text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 transition">
            📊 Analytics
          </a>
          <a href="/admin/history" className="text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 transition">
            📅 History
          </a>
          <a href="/admin/feedback" className="text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 transition">
            ⭐ Feedback
          </a>
          <a href="/admin/menu" className="text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 transition">
            📋 Menu
          </a>
          <a href="/admin/tables" className="text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 transition">
            🔳 QR Codes
          </a>
        </nav>
      </header>

      {/* ============ WAITER CALLS BANNER ============ */}
      {waiterCalls.length > 0 && (
        <div className="bg-red-50 border-b-4 border-red-500 p-3 sm:p-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-bold text-red-800 text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
              🔔 Waiter Calls ({waiterCalls.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {waiterCalls.map((call) => (
                <div
                  key={call._id}
                  className="bg-white border-2 border-red-400 rounded-xl p-3 flex items-center gap-3 shadow-md animate-pulse"
                >
                  <div className="text-3xl flex-shrink-0">
                    {call.callType === 'WATER' ? '💧' : call.callType === 'BILL' ? '🧾' : '🛎️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 text-sm">Table {call.tableNumber}</p>
                    <p className="text-xs text-stone-500 truncate">
                      {call.callType === 'WATER' ? 'Bring Water' : call.callType === 'BILL' ? 'Get Bill' : 'Call Waiter'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveWaiterCall(call._id)}
                    className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-bold text-xs"
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
        <div className="md:hidden bg-white border-b border-stone-200 sticky top-[104px] z-20 shadow-sm">
          <div className="flex">
            {['PLACED', 'PREPARING', 'READY'].map((status) => (
              <button
                key={status}
                onClick={() => setMobileTab(status)}
                className={`flex-1 py-3 text-xs font-bold transition relative ${
                  mobileTab === status
                    ? 'text-emerald-700'
                    : 'text-stone-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{STATUS_LABEL[status]}</span>
                  {grouped[status].length > 0 && (
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                      mobileTab === status ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {grouped[status].length}
                    </span>
                  )}
                </div>
                {mobileTab === status && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ LOADING ============ */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-xl text-stone-500 animate-pulse">Loading orders...</p>
        </div>
      ) : totalOrders === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
          <div className="text-6xl mb-4">☕</div>
          <p className="text-xl font-serif font-bold text-stone-700">No active orders</p>
          <p className="text-sm text-stone-500 mt-2">Orders will appear here in real-time</p>
        </div>
      ) : (
        /* ============ ORDERS GRID ============ */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-3 md:p-6 max-w-7xl mx-auto">
          {['PLACED', 'PREPARING', 'READY'].map((status) => (
            <div
              key={status}
              className={`flex flex-col ${
                mobileTab === status ? 'block' : 'hidden'
              } md:block`}
            >
              {/* Column header - hidden on mobile (we use tabs) */}
              <div className="hidden md:flex justify-between items-center mb-4 px-2">
                <h2 className="font-bold text-lg text-stone-700 uppercase tracking-wider">
                  {status === 'PLACED' ? '🆕 New Orders' : status === 'PREPARING' ? '👨‍🍳 Preparing' : '✅ Ready to Serve'}
                </h2>
                <span className="bg-stone-200 text-stone-700 font-bold px-3 py-1 rounded-full text-sm shadow-inner">
                  {grouped[status].length}
                </span>
              </div>

              {/* Orders list */}
              <div className="space-y-3 md:space-y-4 flex-1">
                {grouped[status].map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-emerald-500"
                  >
                    {/* Order header */}
                    <div className="p-3 md:p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                      <span className="font-extrabold text-lg md:text-xl text-stone-800">
                        Table {order.tableNumber}
                      </span>
                      <span className="text-xs md:text-sm font-medium text-stone-500 bg-white px-2 py-1 rounded shadow-sm border border-stone-100">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Order body */}
                    <div className="p-3 md:p-4">
                      <p className="text-xs md:text-sm font-medium text-stone-500 mb-2 md:mb-3 flex items-center gap-2">
                        <span className="text-base md:text-lg">👤</span>
                        <span className="truncate">{order.customerName}</span>
                      </p>
                      <ul className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                        {order.items.map((it, i) => (
                          <li key={i} className="flex justify-between text-stone-700 text-sm md:text-base font-medium gap-2">
                            <span className="flex items-center gap-1.5 md:gap-2 min-w-0">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded flex-shrink-0">
                                {it.quantity}x
                              </span>
                              <span className="truncate">{it.name}</span>
                            </span>
                            <span className="text-stone-500 flex-shrink-0">₹{it.price * it.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between items-center border-t border-stone-100 pt-2 md:pt-3">
                        <span className="font-bold text-stone-600 text-sm md:text-base">Total</span>
                        <span className="font-extrabold text-lg md:text-xl text-stone-900">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    {STATUS_FLOW[order.orderStatus] && (
                      <div className="p-3 md:p-4 bg-stone-50 border-t border-stone-100">
                        <button
                          onClick={() => updateStatus(order._id, STATUS_FLOW[order.orderStatus].next)}
                          className={`w-full text-white py-3 md:py-3.5 rounded-lg font-bold text-base md:text-lg shadow-sm transition transform active:scale-95 ${STATUS_FLOW[order.orderStatus].color}`}
                        >
                          {STATUS_FLOW[order.orderStatus].label}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {grouped[status].length === 0 && (
                  <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl p-6 md:p-8 text-center text-stone-400 text-sm">
                    No orders in {STATUS_LABEL[status]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
