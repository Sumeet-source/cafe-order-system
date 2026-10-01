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
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <a href="/admin/dashboard" className="text-amber-800 underline text-sm">← Dashboard</a>
      </header>

      <form onSubmit={submit} className="bg-white p-5 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input required placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded p-2" />
        <input required type="number" placeholder="Price (₹)" value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border rounded p-2" />
        <input placeholder="Category (e.g. Coffee)" value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border rounded p-2" />
        <input placeholder="Image URL (optional)" value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          className="border rounded p-2" />
        <textarea placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border rounded p-2 md:col-span-2" />
        <div className="md:col-span-2 flex gap-2">
          <button className="bg-amber-700 text-white px-5 py-2 rounded font-medium">
            {editingId ? 'Update' : 'Add Item'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null); }}
              className="bg-gray-300 px-5 py-2 rounded">Cancel</button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg shadow divide-y">
        {items.map((item) => (
          <div key={item._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{item.name} <span className="text-xs text-gray-500">[{item.category}]</span></p>
              <p className="text-sm text-gray-500">{item.description}</p>
              <p className="text-amber-800 font-bold">₹{item.price}</p>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => toggle(item)}
                className={`px-3 py-1 rounded ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {item.isAvailable ? 'Available' : 'Sold out'}
              </button>
              <button onClick={() => edit(item)} className="px-3 py-1 rounded bg-blue-100 text-blue-700">Edit</button>
              <button onClick={() => remove(item._id)} className="px-3 py-1 rounded bg-red-100 text-red-700">Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-center text-gray-500">No items yet. Add one above.</p>}
      </div>
    </div>
  );
}
