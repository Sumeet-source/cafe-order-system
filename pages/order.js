import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';

export default function OrderPage() {
  const router = useRouter();
  const { table } = router.query;

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

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
  const total = cartEntries.reduce((s, [, { item, qty }]) => s + item.price * qty, 0);

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
        theme: { color: '#047857' }, // Emerald-700
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
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {/* Hero Header */}
      <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop")' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent flex flex-col items-center justify-end pb-8 text-white">
          <h1 className="text-4xl font-serif font-bold tracking-wider drop-shadow-lg">House Bird Cafe</h1>
          <p className="mt-2 text-emerald-200 font-medium tracking-wide bg-stone-900/50 px-4 py-1 rounded-full backdrop-blur-sm">Table {table || '...'} • Scan • Order • Enjoy</p>
        </div>
      </div>

      {/* Menu Section */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        {menu.length === 0 && <p className="text-center text-stone-500 py-10 animate-pulse">Loading menu...</p>}
        
        {categories.map((cat) => (
          <div key={cat} className="mb-10">
            <h2 className="text-2xl font-serif font-bold text-stone-800 mb-4 border-b-2 border-emerald-200 pb-2 inline-block">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menu.filter((m) => (m.category || 'General') === cat).map((item) => (
                <div key={item._id} className={`bg-white rounded-xl p-4 shadow-sm border border-stone-100 flex justify-between items-center transition hover:shadow-md hover:border-emerald-200 ${!item.isAvailable ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-stone-800">{item.name}</h3>
                    {item.description && <p className="text-sm text-stone-500 mt-1 line-clamp-2">{item.description}</p>}
                    <p className="text-emerald-700 font-bold mt-2">₹{item.price}</p>
                  </div>
                  <button
                    disabled={!item.isAvailable}
                    onClick={() => addToCart(item)}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition disabled:bg-stone-300 shadow-sm"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {cartEntries.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-40">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-stone-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 hover:bg-stone-800 transition transform hover:scale-105"
          >
            <span className="bg-emerald-500 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-inner">
              {cartEntries.reduce((s, [, { qty }]) => s + qty, 0)}
            </span>
            <span className="font-medium tracking-wide">View Cart • ₹{total}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-stone-50 h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-white">
              <h2 className="text-xl font-serif font-bold text-stone-800">Your Order</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-800 text-3xl leading-none">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartEntries.map(([id, { item, qty }]) => (
                <div key={id} className="flex justify-between items-center border-b border-stone-200 pb-4">
                  <div>
                    <p className="font-semibold text-stone-800">{item.name}</p>
                    <p className="text-emerald-700 font-bold">₹{item.price * qty}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-full px-3 py-1 shadow-sm">
                    <button onClick={() => removeFromCart(id)} className="text-xl font-bold text-stone-500 hover:text-emerald-600">−</button>
                    <span className="font-medium w-4 text-center text-stone-800">{qty}</span>
                    <button onClick={() => addToCart(item)} className="text-xl font-bold text-stone-500 hover:text-emerald-600">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-stone-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <input
                type="text"
                placeholder="Your name (for the waiter)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-stone-300 rounded-lg p-3 mb-4 focus:ring-emerald-500 focus:border-emerald-500 text-stone-800 placeholder-stone-400"
              />
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition disabled:bg-stone-400 shadow-md"
              >
                {loading ? 'Processing...' : `Pay ₹${total}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
