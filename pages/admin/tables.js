import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import ThemeToggle from '../../components/ThemeToggle';

export default function Tables() {
  const router = useRouter();
  const [qrs, setQrs] = useState([]);
  const [tableCount, setTableCount] = useState(10);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  useEffect(() => {
    const generate = async () => {
      const out = [];
      for (let i = 1; i <= tableCount; i++) {
        const url = `${baseUrl}/order?table=${i}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 1,
          color: { dark: '#064e3b', light: '#ffffff' },
        });
        out.push({ table: i, dataUrl, url });
      }
      setQrs(out);
    };
    generate();
  }, [tableCount, baseUrl]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 relative overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-15 pointer-events-none"></div>

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="px-4 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="House Bird Cafe" className="w-10 h-10 rounded-full bg-white/90 p-0.5 flex-shrink-0 ring-2 ring-white/20 shadow-lg" />
            <h1 className="text-base sm:text-xl font-serif font-bold text-white truncate">
              <span className="hidden sm:inline">House Bird Cafe · QR Codes</span>
              <span className="sm:hidden">QR Codes</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20" />
            <button onClick={logout} className="text-xs bg-red-500/80 hover:bg-red-500 text-white px-3 py-2 rounded-xl border border-white/20 font-medium">Logout</button>
          </div>
        </div>
        <nav className="flex gap-2 px-4 pb-3 overflow-x-auto md:justify-center">
          <a href="/admin/dashboard" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">🏠 Dashboard</a>
          <a href="/admin/analytics" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">📊 Analytics</a>
          <a href="/admin/history" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">📅 History</a>
          <a href="/admin/feedback" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">⭐ Feedback</a>
          <a href="/admin/menu" className="text-xs font-medium whitespace-nowrap px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition">📋 Menu</a>
        </nav>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-5 shadow-2xl mb-6 flex flex-wrap items-center gap-3">
          <label className="text-white font-medium text-sm">Number of tables:</label>
          <input
            type="number" min="1" max="50" value={tableCount}
            onChange={(e) => setTableCount(Number(e.target.value))}
            className="w-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 text-center text-white font-bold focus:ring-2 focus:ring-emerald-400 outline-none"
          />
          <button onClick={() => window.print()} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition text-sm">
            🖨️ Print All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {qrs.map((q) => (
            <div key={q.table} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl text-center hover:bg-white/15 transition flex flex-col items-center">
              <h3 className="font-serif font-bold text-lg text-white mb-3">Table {q.table}</h3>
              <div className="bg-white p-2 rounded-xl shadow-lg mb-3">
                <img src={q.dataUrl} alt={`QR Table ${q.table}`} className="w-32 h-32 md:w-40 md:h-40" />
              </div>
              <p className="text-[9px] text-white/40 break-all bg-white/5 p-1.5 rounded border border-white/10 w-full">
                {q.url}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
