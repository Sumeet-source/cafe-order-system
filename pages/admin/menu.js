import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Upload, X, ImagePlus } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import AdminNav from '../../components/AdminNav';
import LogoutButton from '../../components/LogoutButton';

const EMPTY = { name: '', description: '', price: '', category: 'General', imageUrl: '', isAvailable: true };

export default function AdminMenu() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await fetch('/api/menu');
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => { load(); }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Only image files allowed.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setForm({ ...form, imageUrl: data.url });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price) };
    const url = editingId ? `/api/menu/${editingId}` : '/api/menu';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) { router.push('/admin/login'); return; }
    if (res.ok) {
      setForm(EMPTY);
      setEditingId(null);
      load();
    } else {
      alert('Failed: ' + (await res.json()).error);
    }
    setSaving(false);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const inputClass = "w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none";

  return (
    <div className="admin-shell min-h-screen bg-stone-950 relative overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-stone-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="House Bird Cafe" className="w-10 h-10 rounded-full bg-white/90 p-0.5 flex-shrink-0 ring-2 ring-white/20" />
            <h1 className="text-base sm:text-xl font-serif font-bold text-white truncate">
              <span className="hidden sm:inline">House Bird Cafe · Menu</span>
              <span className="sm:hidden">Menu</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <AdminNav />
      </header>

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-6">
        <form onSubmit={submit} className="bg-white/10 border border-white/20 rounded-2xl p-5 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">
            {editingId ? '✏️ Edit Item' : '➕ Add New Item'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input required placeholder="Name (e.g. Cappuccino)" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            <input required type="number" placeholder="Price (₹)" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
            <input placeholder="Category (e.g. Coffee)" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
            <input placeholder="Description (optional)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wide mb-2">
                Menu Item Photo
              </label>
              <div className="flex items-start gap-3">
                {form.imageUrl ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-stone-900 flex-shrink-0">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: '' })}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 flex-shrink-0">
                    <ImagePlus size={28} className="text-white/40" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl font-medium text-sm cursor-pointer transition-colors">
                    <Upload size={16} strokeWidth={2.5} />
                    {uploading ? 'Uploading...' : form.imageUrl ? 'Change Photo' : 'Choose Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-white/40 mt-2">JPG, PNG, WebP · Max 10 MB</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button disabled={saving || uploading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null); }}
                className="bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mb-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Menu Items</h2>
          <span className="bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
            {items.length} items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item._id} className="bg-white/10 border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-colors">
              <div className="flex gap-3 mb-3">
                {item.imageUrl ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-stone-900">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-white/10 flex items-center justify-center bg-white/5 flex-shrink-0">
                    <ImagePlus size={20} className="text-white/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-white truncate">{item.name}</p>
                    <span className="font-extrabold text-emerald-400 text-lg flex-shrink-0">₹{item.price}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-200 bg-emerald-400/20 border border-emerald-300/30 px-2 py-0.5 rounded-full inline-block mt-1">
                    {item.category}
                  </span>
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-white/60 mb-3 line-clamp-2">{item.description}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                <button onClick={() => toggle(item)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                    item.isAvailable
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                  }`}>
                  {item.isAvailable ? '✓ Available' : '✕ Sold Out'}
                </button>
                <button onClick={() => edit(item)} className="text-[11px] px-3 py-1.5 rounded-lg font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 transition-colors">
                  Edit
                </button>
                <button onClick={() => remove(item._id)} className="text-[11px] px-3 py-1.5 rounded-lg font-bold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="md:col-span-2 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-12 text-center text-white/50">
              No items yet. Add your first one above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}