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
    if (!table) return alert('No table detected. Please rescan the QR code.');

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
      if (!createRes.ok) throw new Error(createData.error || 'Payment init failed');

      const options = {
        key: createData.keyId,
        amount: createData.amount,
        currency: 'INR',
        name: 'Cafe Order',
        description: `Table ${table}`,
        order_id: createData.orderId,
        prefill: { name },
        theme: { color: '#8B4513' },
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
            alert('Payment verification failed: ' + (verifyData.error || 'unknown'));
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

  // Group by category
  const categories = [...new Set(menu.map((m) => m.category || 'General'))];

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="min-h-screen pb-40">
        <header className="bg-amber-800 text-white p-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold">☕ Cafe Menu</h1>
          <p className="text-sm opacity-90">Table {table || '...'}</p>
        </header>

        <main className="max-w-2xl mx-auto p-4">
          {menu.length === 0 && <p className="text-center text-gray-500 mt-10">Loading menu...</p>}

          {categories.map((cat) => (
            <section key={cat} className="mb-8">
              <h2 className="text-lg font-bold text-amber-900 mb-3 border-b border-amber-200 pb-1">{cat}</h2>
              <div className="space-y-3">
                {menu.filter((m) => (m.category || 'General') === cat).map((item) => (
                  <div key={item._id} className={`bg-white rounded-lg p-4 shadow-sm flex justify-between items-start ${!item.isAvailable ? 'opacity-50' : ''}`}>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                      <p className="text-amber-800 font-bold mt-2">₹{item.price}</p>
                    </div>
                    <button
                      disabled={!item.isAvailable}
                      onClick={() => addToCart(item)}
                      className="ml-3 bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300"
                    >
                      {item.isAvailable ? 'Add' : 'Sold out'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>

        {cartEntries.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-amber-700 p-4 max-w-2xl mx-auto shadow-2xl">
            <div className="max-h-48 overflow-y-auto mb-3">
              {cartEntries.map(([id, { item, qty }]) => (
                <div key={id} className="flex justify-between items-center py-1 text-sm">
                  <span>{item.name} × {qty}</span>
                  <div className="flex items-center gap-2">
                    <span>₹{item.price * qty}</span>
                    <button onClick={() => removeFromCart(id)} className="text-red-500 font-bold px-1">−</button>
                    <button onClick={() => addToCart(item)} className="text-green-600 font-bold px-1">+</button>
                  </div>
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Your name (for the waiter)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg p-2 mb-3 text-sm"
            />
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-amber-700 text-white py-3 rounded-lg font-bold disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : `Pay ₹${total}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
