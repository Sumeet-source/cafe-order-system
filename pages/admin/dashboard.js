import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { ChefHat, PackageCheck, Truck, Bell, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import AdminNav from '../../components/AdminNav';
import LogoutButton from '../../components/LogoutButton';

const STATUS_FLOW = {
  PLACED:    { next: 'PREPARING', label: 'Start Preparing', Icon: ChefHat,      cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  PREPARING: { next: 'READY',     label: 'Mark Ready',       Icon: PackageCheck, cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  READY:     { next: 'DELIVERED', label: 'Mark Delivered',   Icon: Truck,        cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
};

const COLUMN_META = {
  PLACED:    { label: 'New Orders',     Icon: Bell,         short: 'New' },
  PREPARING: { label: 'Preparing',      Icon: ChefHat,      short: 'Prep' },
  READY:     { label: 'Ready to Serve', Icon: CheckCircle2, short: 'Ready' },
};

const STATUS_ACCENT = {
  PLACED:    'bg-emerald-500',
  PREPARING: 'bg-emerald-600',
  READY:     'bg-emerald-700',
};

export default function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState('PLACED');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const lastPlacedIds = useRef(new Set());
  const lastWaiterIds = useRef(new Set());
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

  const applyState = (state) => {
    const placed = state.placed || [];
    const preparing = state.preparing || [];
    const ready = state.ready || [];
    const calls = state.waiterCalls || [];

    // Detect new placed orders
    const newPlacedIds = new Set(placed.map((o) => o._id));
    const hasNewPlaced = placed.some((o) => !lastPlacedIds.current.has(o._id));
    lastPlacedIds.current = newPlacedIds;

    // Detect new waiter calls
    const newWaiterIds = new Set(calls.map((c) => c._id));
    const hasNewWaiter = calls.some((c) => !lastWaiterIds.current.has(c._id));
    lastWaiterIds.current = newWaiterIds;

    // Beep on new arrivals (not on first load)
    if (hasNewPlaced || hasNewWaiter) beep();

    setOrders([...placed, ...preparing, ...ready]);
    setWaiterCalls(calls);
    setLoading(false);
  };

  // ============ SSE CONNECTION ============
  useEffect(() => {
    let es = null;
    let reconnectTimer = null;
    let fallbackTimer = null;
    let retries = 0;
    let fallbackMode = false;
    let cancelled = false;

    const startPolling = () => {
      fallbackMode = true;
      setConnectionStatus('polling');
      const poll = async () => {
        if (cancelled) return;
        try {
          const [r1, r2, r3, r4] = await Promise.all([
            fetch('/api/orders?status=PLACED'),
            fetch('/api/orders?status=PREPARING'),
            fetch('/api/orders?status=READY'),
            fetch('/api/waiter-call'),
          ]);
          if (r1.status === 401) { router.push('/admin/login'); return; }
          const placed = r1.ok ? await r1.json() : [];
          const preparing = r2.ok ? await r2.json() : [];
          const ready = r3.ok ? await r3.json() : [];
          const calls = r4.ok ? await r4.json() : [];
          applyState({ placed, preparing, ready, waiterCalls: calls });
        } catch {}
        if (!cancelled) fallbackTimer = setTimeout(poll, 5000);
      };
      poll();
    };

    const startSSE = () => {
      if (cancelled) return;
      setConnectionStatus('connecting');
      try {
        es = new EventSource('/api/realtime/stream');

        es.addEventListener('init', (e) => {
          retries = 0;
          setConnectionStatus('live');
          try {
            applyState(JSON.parse(e.data));
          } catch {}
        });

        es.addEventListener('update', (e) => {
          setConnectionStatus('live');
          try {
            applyState(JSON.parse(e.data));
          } catch {}
        });

        es.onerror = () => {
          if (es) es.close();
          es = null;
          if (fallbackMode || cancelled) return;
          retries++;
          setConnectionStatus('reconnecting');
          if (retries >= 3) {
            startPolling();
          } else {
            reconnectTimer = setTimeout(startSSE, 2000);
          }
        };
      } catch {
        startPolling();
      }
    };

    startSSE();

    return () => {
      cancelled = true;
      if (es) es.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  // ============ ACTIONS ============
  const updateStatus = async (id, next) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: next }),
    });
    // SSE will auto-update within 2s
  };

  const resolveWaiterCall = async (id) => {
    await fetch('/api/waiter-call', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    // SSE will auto-update
  };

  const grouped = { PLACED: [], PREPARING: [], READY: [] };
  orders.forEach((o) => { if (grouped[o.orderStatus]) grouped[o.orderStatus].push(o); });

  const totalOrders = grouped.PLACED.length + grouped.PREPARING.length + grouped.READY.length;

  const statusColor = {
    live: 'bg-emerald-500',
    connecting: 'bg-amber-500',
    reconnecting: 'bg-amber-500',
    polling: 'bg-blue-500',
  }[connectionStatus] || 'bg-stone-500';

  const statusLabel = {
    live: 'LIVE',
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
    polling: 'Polling',
  }[connectionStatus] || '';

  return (
    <div className="admin-shell min-h-screen bg-stone-950 relative overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-stone-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="House Bird Cafe" className="w-10 h-10 rounded-full bg-white/90 p-0.5 flex-shrink-0 ring-2 ring-white/20" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-serif font-bold tracking-wide text-white truncate">
                <span className="hidden sm:inline">House Bird Cafe · Kitchen</span>
                <span className="sm:hidden">House Bird Cafe</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${statusColor} ${connectionStatus === 'live' ? 'animate-pulse' : ''}`}></span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide">{statusLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <AdminNav />
      </header>

      {waiterCalls.length > 0 && (
        <div className="relative z-20 p-3 sm:p-4">
          <div className="max-w-7xl mx-auto bg-red-500/15 border-2 border-red-400/40 rounded-2xl p-3 sm:p-4">
            <h2 className="font-bold text-red-100 text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
              🔔 Waiter Calls
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{waiterCalls.length}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {waiterCalls.map((call) => (
                <div key={call._id} className="bg-white/10 border border-red-300/40 rounded-xl p-3 flex items-center gap-3 animate-pulse">
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
                  <button onClick={() => resolveWaiterCall(call._id)} className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-bold text-xs">
                    Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="md:hidden sticky top-[124px] z-20 px-3 pt-3">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-1 flex">
            {['PLACED', 'PREPARING', 'READY'].map((status) => {
              const isActive = mobileTab === status;
              const TabIcon = COLUMN_META[status].Icon;
              return (
                <button key={status} onClick={() => setMobileTab(status)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${isActive ? 'bg-emerald-600 text-white' : 'text-white/60 hover:text-white'}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <TabIcon size={14} strokeWidth={2.5} />
                    <span>{COLUMN_META[status].short}</span>
                    {grouped[status].length > 0 && (
                      <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${isActive ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70'}`}>{grouped[status].length}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96 relative z-10">
          <p className="text-lg text-white/90 animate-pulse">Loading orders...</p>
        </div>
      ) : totalOrders === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 p-6 text-center relative z-10">
          <div className="bg-white/10 border border-white/20 rounded-3xl px-8 py-10 max-w-sm">
            <div className="text-6xl mb-4">☕</div>
            <p className="text-xl font-serif font-bold text-white">No active orders</p>
            <p className="text-sm text-white/60 mt-2">Orders will appear here in real-time</p>
          </div>
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-3 md:p-6 max-w-7xl mx-auto">
          {['PLACED', 'PREPARING', 'READY'].map((status) => {
            const ColumnIcon = COLUMN_META[status].Icon;
            return (
              <div key={status} className={`flex flex-col ${mobileTab === status ? 'block' : 'hidden'} md:block`}>
                <div className="hidden md:flex justify-between items-center mb-4 px-2">
                  <h2 className="font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
                    <ColumnIcon size={18} strokeWidth={2.5} className="text-emerald-400" />
                    {COLUMN_META[status].label}
                  </h2>
                  <span className="bg-white/10 border border-white/20 text-white font-bold px-3 py-1 rounded-full text-sm">{grouped[status].length}</span>
                </div>
                <div className="space-y-3 md:space-y-4 flex-1">
                  {grouped[status].map((order) => {
                    const flow = STATUS_FLOW[order.orderStatus];
                    const ActionIcon = flow?.Icon;
                    return (
                      <div key={order._id} className="relative bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
                        <div className={`h-1 ${STATUS_ACCENT[order.orderStatus]}`}></div>
                        <div className="p-3 md:p-4 flex justify-between items-center border-b border-white/10">
                          <span className="font-extrabold text-lg md:text-xl text-white">Table {order.tableNumber}</span>
                          <span className="text-xs md:text-sm font-medium text-white/80 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="p-3 md:p-4">
                          <p className="text-xs md:text-sm font-medium text-white/70 mb-2 md:mb-3 flex items-center gap-2">
                            <span className="text-base md:text-lg">👤</span>
                            <span className="truncate">{order.customerName}</span>
                          </p>
                          <ul className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                            {order.items.map((it, i) => (
                              <li key={i} className="flex justify-between text-white text-sm md:text-base font-medium gap-2">
                                <span className="flex items-center gap-1.5 md:gap-2 min-w-0">
                                  <span className="bg-emerald-400/30 text-emerald-100 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded border border-emerald-300/30 flex-shrink-0">{it.quantity}x</span>
                                  <span className="truncate">{it.name}</span>
                                </span>
                                <span className="text-white/70 flex-shrink-0">₹{it.price * it.quantity}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between items-center border-t border-white/10 pt-2 md:pt-3">
                            <span className="font-bold text-white/70 text-sm md:text-base">Total</span>
                            <span className="font-extrabold text-xl md:text-2xl text-white">₹{order.totalAmount}</span>
                          </div>
                        </div>
                        {flow && (
                          <div className="p-3 md:p-4">
                            <button
                              onClick={() => updateStatus(order._id, flow.next)}
                              className={`${flow.cls} w-full py-3 md:py-3.5 rounded-xl font-bold text-base md:text-lg transition-colors duration-150 transform active:scale-95 flex items-center justify-center gap-2`}
                            >
                              <ActionIcon size={18} strokeWidth={2.5} />
                              {flow.label}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {grouped[status].length === 0 && (
                    <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-6 md:p-8 text-center text-white/40 text-sm">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="h-8"></div>
    </div>
  );
}