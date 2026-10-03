import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import ThemeToggle from '../components/ThemeToggle';

export default function OrderPage() {
  const router = useRouter();
  const { table } = router.query;

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWaiterOpen, setIsWaiterOpen] = useState(false);
  const [waiterSent, setWaiterSent] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => setMenu(Array.isArray(data) ? data : []))
      .catch(() => setMenu([]));
  }, []);

  const addToCart = (item) => {
    setCart((c) => {
      const existing = c[item._id];
      return { ...c, [item._id]: { item, qty: (existing?.qty || 0) + 1 } };
    });
    setBump(true);
    setTimeout(() => setBump(false), 300);
  };

  const removeFromCart = (id) => {
    setCart((c) => {
      const next = { ...c };
      if (!next[id]) return next;
      if (next[id].qty > 1) next[id].qty -= 1;
      else delete next[id];
      return next;
    });
  };

  const cartEntries = Object.entries(cart);
  const itemCount = cartEntries.reduce((s, [, { qty }]) => s + qty, 0);
  const total = cartEntries.reduce((s, [, { item, qty }]) => s + item.price * qty, 0);

  const callWaiter = async (callType) => {
    try {
      const res = await fetch('/api/waiter-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: Number(table), callType }),
      });
      if (res.ok) {
        setWaiterSent(true);
        setIsWaiterOpen(false);
        setTimeout(() => setWaiterSent(false), 120000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to call waiter');
      }
    } catch {
      alert('Something went wrong');
    }
  };

  const handleCheckout = async () => {
    if (!cartEntries.length) return alert('Cart is empty');
    if (!name.trim()) return alert('Please enter your name');

    setLoading(true);
    try {
      const items = cartEntries.map(([, { item, qty }]) => ({
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: qty,
      }));

      const createRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);

      const options = {
        key: createData.keyId,
        amount: createData.amount,
        currency: 'INR',
        name: 'House Bird Cafe',
        description: `Table ${table}`,
        order_id: createData.orderId,
        prefill: { name },
        theme: { color: '#047857' },
        handler: async (response) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              tableNumber: Number(table),
              items,
              totalAmount: total,
              customerName: name,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            router.push(`/order/success?table=${table}&orderId=${verifyData.orderId}`);
          } else {
            alert('Payment failed');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const categories = [...new Set(menu.map((m) => m.category || 'General'))];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Hero Header */}
      <div
        className="relative h-72 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop")',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/70 to-stone-900/40 flex flex-col items-center justify-end pb-6 text-white force-white">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <div className="bg-white rounded-full p-1 shadow-2xl ring-4 ring-white/30 mb-3">
            <img
              src="/logo.png"
              alt="House Bird Cafe"
              className="w-20 h-20 rounded-full"
            />
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-wider drop-shadow-lg">
            House Bird Cafe
          </h1>
          <p className="mt-2 text-emerald-100 font-medium tracking-wide bg-stone-900/60 px-4 py-1 rounded-full backdrop-blur-sm text-sm">
            Table {table || '...'} • Scan • Order • Enjoy
          </p>
        </div>
      </div>

      {/* Menu Section */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {menu.length === 0 && (
          <p className="text-center text-stone-500 dark:text-stone-400 py-10 animate-pulse">
            Loading menu...
          </p>
        )}

        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-4 border-b-2 border-emerald-200 dark:border-emerald-800 pb-2 inline-block">
              {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {menu
                .filter((m) => (m.category || 'General') === cat)
                .map((item) => (
                  <div
                    key={item._id}
                    className={`bg-white dark:bg-stone-900 rounded-xl p-4 shadow-sm border border-stone-100 dark:border-stone-800 flex justify-between items-center transition hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 ${
                      !item.isAvailable ? 'opacity-50 grayscale' : ''
                    }`}
                  >
                    <div className="flex-1 pr-4 min-w-0">
                      <h3 className="font-bold text-stone-800 dark:text-stone-100 truncate">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-emerald-700 dark:text-emerald-400 font-bold mt-2">
                        ₹{item.price}
                      </p>
                    </div>
                    <button
                      disabled={!item.isAvailable}
                      onClick={() => addToCart(item)}
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition disabled:bg-stone-300 dark:disabled:bg-stone-700 shadow-sm"
                    >
                      +
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Zomato-style Cart Bar */}
     {/* Zomato-style Cart Bar — compact */}
{/* Zomato-style Cart Bar — narrow pill */}
{cartEntries.length > 0 && (
  <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4 animate-slide-up">
    <button
      onClick={() => setIsCartOpen(true)}
      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-full shadow-xl shadow-emerald-500/40 flex items-center gap-5 transition-all duration-300 active:scale-[0.98] ring-1 ring-emerald-400/30"
    >
      <span className={`text-sm font-semibold tracking-wide force-white ${bump ? 'animate-bump' : ''}`}>
        {itemCount} {itemCount === 1 ? 'item added' : 'items added'}
      </span>
      <span className="flex items-center gap-0.5 font-semibold text-sm force-white border-l border-white/30 pl-4">
        Continue
        <span className="text-lg leading-none font-light">›</span>
      </span>
    </button>
  </div>
)}

      {/* Call Waiter Button — hidden while cart has items */}
      {cartEntries.length === 0 && (
        <button
          onClick={() => setIsWaiterOpen(true)}
          disabled={waiterSent}
          className={`fixed bottom-6 left-6 z-40 w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center text-white font-bold transition transform hover:scale-110 ${
            waiterSent
              ? 'bg-stone-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 animate-pulse'
          }`}
        >
          <span className="text-2xl">{waiterSent ? '✓' : '🛎️'}</span>
          <span className="text-[10px] mt-0.5">{waiterSent ? 'Sent' : 'Call'}</span>
        </button>
      )}

      {/* Waiter Modal */}
      {isWaiterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"
            onClick={() => setIsWaiterOpen(false)}
          />
          <div className="relative bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-2 text-center">
              How can we help?
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm text-center mb-6">
              Table {table}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => callWaiter('WAITER')}
                className="w-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 p-4 rounded-2xl flex items-center gap-4 transition"
              >
                <span className="text-3xl">🛎️</span>
                <div className="text-left">
                  <p className="font-bold">Call Waiter</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Need any assistance</p>
                </div>
              </button>

              <button
                onClick={() => callWaiter('WATER')}
                className="w-full bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-200 p-4 rounded-2xl flex items-center gap-4 transition"
              >
                <span className="text-3xl">💧</span>
                <div className="text-left">
                  <p className="font-bold">Bring Water</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">Refill your glass</p>
                </div>
              </button>

              <button
                onClick={() => callWaiter('BILL')}
                className="w-full bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 p-4 rounded-2xl flex items-center gap-4 transition"
              >
                <span className="text-3xl">🧾</span>
                <div className="text-left">
                  <p className="font-bold">Get Bill</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">Ready to pay</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setIsWaiterOpen(false)}
              className="w-full mt-4 text-stone-500 dark:text-stone-400 font-medium py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-stone-50 dark:bg-stone-900 h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-950">
              <h2 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100">
                Your Order
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 text-3xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartEntries.map(([id, { item, qty }]) => (
                <div
                  key={id}
                  className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-4"
                >
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-stone-100">
                      {item.name}
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                      ₹{item.price * qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 shadow-sm">
                    <button
                      onClick={() => removeFromCart(id)}
                      className="text-xl font-bold text-stone-500 dark:text-stone-400 hover:text-emerald-600"
                    >
                      −
                    </button>
                    <span className="font-medium w-4 text-center text-stone-800 dark:text-stone-100">
                      {qty}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="text-xl font-bold text-stone-500 dark:text-stone-400 hover:text-emerald-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
              <input
                type="text"
                placeholder="Your name (for the waiter)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-stone-300 dark:border-stone-700 rounded-lg p-3 mb-4 bg-white dark:bg-stone-800 focus:ring-emerald-500 focus:border-emerald-500 text-stone-800 dark:text-stone-100 placeholder-stone-400"
              />
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="force-white w-full bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition disabled:bg-stone-400 dark:disabled:bg-stone-700 shadow-md"
              >
                {loading ? 'Processing...' : `Pay ₹${total}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-8 text-stone-400 dark:text-stone-600 text-xs">
        <a href="/admin/login" className="hover:text-stone-500 dark:hover:text-stone-500 transition">
          House Bird Cafe · Admin
        </a>
      </div>
    </div>
  );
}