import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const EMPTY = { name: '', description: '', price: '', category: 'General', imageUrl: '', isAvailable: true };

export default function AdminMenu() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const res = await fetch('/api/menu');
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price) };
    const url = editingId ? `/api/menu/${editingId}` : '/api/menu';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) { router.push('/admin/login'); return; }
    if (res.ok) { setForm(EMPTY); setEditingId(null); load(); }
    else alert('Failed: ' + (await res.json()).error);
  };

  const edit = (item) => {
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || 'General',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    });
    setEditingId(item._id);
  };

  const remove = async (id) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    load();
  };

  const toggle = async (item) => {
    await fetch(`/api/menu/${item._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    load();
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <header className="mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-stone-800">Bird Tree Cafe - Menu</h1>
        <a href="/admin/dashboard" className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-900 transition">← Back to Dashboard</a>
      </header>

      <div className="max-w-6xl mx-auto">
        <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow-md mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 border border-stone-200">
          <h2 className="md:col-span-2 text-lg font-bold text-stone-700">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
          <input required placeholder="Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-stone-300 rounded-lg p-3 focus:ring-emerald-500 focus:border-emerald-500" />
          <input required type="number" placeholder="Price (₹)" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border border-stone-300 rounded-lg p-3 focus:ring-emerald-500 focus:border-emerald-500" />
          <input placeholder="Category (e.g. Coffee)" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border border-stone-300 rounded-lg p-3 focus:ring-emerald-500 focus:border-emerald-500" />
          <input placeholder="Image URL (optional)" value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="border border-stone-300 rounded-lg p-3 focus:ring-emerald-500 focus:border-emerald-500" />
          <textarea placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-stone-300 rounded-lg p-3 md:col-span-2 focus:ring-emerald-500 focus:border-emerald-500" />
          <div className="md:col-span-2 flex gap-3">
            <button className="bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-800 transition shadow-sm">
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null); }}
                className="bg-stone-200 text-stone-700 px-6 py-3 rounded-lg font-bold hover:bg-stone-300 transition">Cancel</button>
            )}
          </div>
        </form>

        <div className="bg-white rounded-xl shadow-md border border-stone-200 divide-y divide-stone-100">
          {items.map((item) => (
            <div key={item._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="font-bold text-lg text-stone-800">{item.name} <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded ml-2">{item.category}</span></p>
                <p className="text-sm text-stone-500 mt-1">{item.description}</p>
                <p className="text-emerald-700 font-bold text-lg mt-1">₹{item.price}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm w-full sm:w-auto">
                <button onClick={() => toggle(item)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${item.isAvailable ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                  {item.isAvailable ? 'Available' : 'Sold out'}
                </button>
                <button onClick={() => edit(item)} className="px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition">Edit</button>
                <button onClick={() => remove(item._id)} className="px-4 py-2 rounded-lg font-medium bg-red-50 text-red-700 hover:bg-red-100 transition">Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="p-10 text-center text-stone-500 font-medium">No items yet. Add one above.</p>}
        </div>
      </div>
    </div>
  );
}
