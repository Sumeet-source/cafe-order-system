import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const STATUS_FLOW = {
  PLACED:    { next: 'PREPARING', label: 'Start Preparing', color: 'bg-yellow-500' },
  PREPARING: { next: 'READY',     label: 'Mark Ready',       color: 'bg-blue-500'   },
  READY:     { next: 'DELIVERED', label: 'Mark Delivered',   color: 'bg-green-600'  },
};

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastCount = useRef(0);
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
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  const updateStatus = async (id, next) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: next }),
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🍽️ Orders Dashboard</h1>
        <div className="flex gap-3">
          <a href="/admin/menu" className="text-sm underline">Menu</a>
          <a href="/admin/tables" className="text-sm underline">QR Codes</a>
          <button onClick={logout} className="text-sm bg-amber-900 px-3 py-1 rounded">Logout</button>
        </div>
      </header>

      {loading ? (
        <p className="text-center mt-20 text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {['PLACED', 'PREPARING', 'READY'].map((status) => (
            <section key={status}>
              <h2 className="font-bold text-lg mb-3 capitalize">
                {status.toLowerCase()} ({grouped[status].length})
              </h2>
              <div className="space-y-3">
                {grouped[status].map((order) => (
                  <div key={order._id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Table {order.tableNumber}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">👤 {order.customerName}</p>
                    <ul className="text-sm space-y-1 mb-3 border-y py-2">
                      {order.items.map((it, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{it.name} × {it.quantity}</span>
                          <span>₹{it.price * it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-bold text-right mb-3">Total: ₹{order.totalAmount}</p>
                    {STATUS_FLOW[order.orderStatus] && (
                      <button
                        onClick={() => updateStatus(order._id, STATUS_FLOW[order.orderStatus].next)}
                        className={`w-full text-white py-2 rounded font-medium ${STATUS_FLOW[order.orderStatus].color}`}
                      >
                        {STATUS_FLOW[order.orderStatus].label}
                      </button>
                    )}
                  </div>
                ))}
                {grouped[status].length === 0 && (
                  <p className="text-sm text-gray-400 italic">No orders</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
