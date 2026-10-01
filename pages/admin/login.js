import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.push('/admin/dashboard');
    else setErr('Wrong password');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
      <form onSubmit={submit} className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm border border-stone-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-stone-800">Bird Tree Cafe</h1>
          <p className="text-stone-500 text-sm mt-1">Admin Portal</p>
        </div>
        <input
          type="password"
          placeholder="Enter Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-stone-300 rounded-lg p-3 mb-4 focus:ring-emerald-500 focus:border-emerald-500 text-stone-800"
        />
        {err && <p className="text-red-500 text-sm mb-4 text-center">{err}</p>}
        <button className="w-full bg-emerald-700 text-white py-3 rounded-lg font-bold hover:bg-emerald-800 transition shadow-md">
          Login
        </button>
      </form>
    </div>
  );
}
