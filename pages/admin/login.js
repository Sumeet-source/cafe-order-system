import { useState } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from '../../components/ThemeToggle';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/admin/dashboard');
    } else {
      setErr('Wrong password');
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-stone-950 flex items-center justify-center p-6">
      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <form
        onSubmit={submit}
        className="relative bg-white/5 border border-white/10 p-10 rounded-3xl w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="bg-white rounded-full p-1 w-24 h-24 mx-auto mb-4 ring-2 ring-white/20">
            <img src="/logo.png" alt="House Bird Cafe" className="w-full h-full rounded-full" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white">House Bird Cafe</h1>
          <p className="text-white/60 text-sm mt-1">Admin Portal</p>
        </div>

        <input
          type="password"
          placeholder="Enter Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full bg-white/5 border border-white/20 rounded-xl p-4 mb-4 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition"
        />

        {err && (
          <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3 mb-4">
            <p className="text-red-100 text-sm text-center font-medium">{err}</p>
          </div>
        )}

        <button
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}