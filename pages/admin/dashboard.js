import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const STATUS_FLOW = {
  PLACED:    { next: 'PREPARING', label: 'Start Preparing', color: 'bg-amber-500 hover:bg-amber-600' },
  PREPARING: { next: 'READY',     label: 'Mark Ready',       color: 'bg-blue-600 hover:bg-blue-700'   },
  READY:     { next: 'DELIVERED', label: 'Mark Delivered',   color: 'bg-emerald-600 hover:bg-emerald-700'  },
};

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
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

    // Fetch waiter calls
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

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-stone-900 text-white p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌳</span>
          <h1 className="text-xl font-serif font-bold tracking-wide">House Bird Cafe - Kitchen</h1>
        </div>
        <div className="flex gap-4 items-center">
           <a href="/admin/analytics" className="text-sm font-medium hover:text-emerald-400 transition">Analytics</a>
  <a href="/admin/history" className="text-sm font-medium hover:text-emerald-400 transition">History</a>
  <a href="/admin/menu" className="text-sm font-medium hover:text-emerald-400 transition">Menu</a>
  <a href="/admin/tables" className="text-sm font-medium hover:text-emerald-400 transition">QR Codes</a>
  <button onClick={logout} className="text-sm bg-stone-700 px-4 py-1.5 rounded-md hover:bg-red-600 transition">Logout</button>
        </div>
      </header>

      {/* Waiter Calls Banner */}
      {waiterCalls.length > 0 && (
        <div className="bg-red-50 border-b-4 border-red-500 p-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-bold text-red-800 text-lg mb-3 flex items-center gap-2">
              🔔 Waiter Calls ({waiterCalls.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {waiterCalls.map((call) => (
                <div key={call._id} className="bg-white border-2 border-red-400 rounded-xl p-4 flex items-center gap-4 shadow-lg animate-pulse">
                  <div className="text-3xl">
                    {call.callType === 'WATER' ? '💧' : call.callType === 'BILL' ? '🧾' : '🛎️'}
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">Table {call.tableNumber}</p>
                    <p className="text-xs text-stone-500">
                      {call.callType === 'WATER' ? 'Bring Water' : call.callType === 'BILL' ? 'Get Bill' : 'Call Waiter'}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveWaiterCall(call._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-xl text-stone-500 animate-pulse">Loading orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
          {['PLACED', 'PREPARING', 'READY'].map((status) => (
            <div key={status} className="flex flex-col">
              <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="font-bold text-lg text-stone-700 uppercase tracking-wider">
                  {status === 'PLACED' ? '🆕 New Orders' : status === 'PREPARING' ? '👨‍🍳 Preparing' : '✅ Ready to Serve'}
                </h2>
                <span className="bg-stone-200 text-stone-700 font-bold px-3 py-1 rounded-full text-sm shadow-inner">
                  {grouped[status].length}
                </span>
              </div>
              
              <div className="space-y-4 flex-1">
                {grouped[status].map((order) => (
                  <div key={order._id} className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-emerald-500">
                    <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                      <span className="font-extrabold text-xl text-stone-800">Table {order.tableNumber}</span>
                      <span className="text-sm font-medium text-stone-500 bg-white px-2 py-1 rounded shadow-sm border border-stone-100">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-sm font-medium text-stone-500 mb-3 flex items-center gap-2">
                        <span className="text-lg">👤</span> {order.customerName}
                      </p>
                      <ul className="space-y-2 mb-4">
                        {order.items.map((it, i) => (
                          <li key={i} className="flex justify-between text-stone-700 font-medium">
                            <span className="flex items-center gap-2">
                              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                                {it.quantity}x
                              </span>
                              {it.name}
                            </span>
                            <span className="text-stone-500">₹{it.price * it.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between items-center border-t border-stone-100 pt-3">
                        <span className="font-bold text-stone-600">Total</span>
                        <span className="font-extrabold text-xl text-stone-900">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {STATUS_FLOW[order.orderStatus] && (
                      <div className="p-4 bg-stone-50 border-t border-stone-100">
                        <button
                          onClick={() => updateStatus(order._id, STATUS_FLOW[order.orderStatus].next)}
                          className={`w-full text-white py-3 rounded-lg font-bold text-lg shadow-sm transition transform hover:scale-[1.02] ${STATUS_FLOW[order.orderStatus].color}`}
                        >
                          {STATUS_FLOW[order.orderStatus].label}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {grouped[status].length === 0 && (
                  <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl p-8 text-center text-stone-400">
                    No orders here
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
