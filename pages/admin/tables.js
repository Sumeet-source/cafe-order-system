import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function Tables() {
  const [qrs, setQrs] = useState([]);
  const [tableCount, setTableCount] = useState(10);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  useEffect(() => {
    const generate = async () => {
      const out = [];
      for (let i = 1; i <= tableCount; i++) {
        const url = `${baseUrl}/order?table=${i}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 1, color: { dark: '#1c1917', light: '#ffffff' } });
        out.push({ table: i, dataUrl, url });
      }
      setQrs(out);
    };
    generate();
  }, [tableCount, baseUrl]);

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-stone-800">House Bird Cafe - QR Codes</h1>
        <div className="flex items-center gap-3">
          <a href="/admin/dashboard" className="text-stone-600 hover:text-stone-900 font-medium text-sm underline">← Back to Dashboard</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mb-8 flex flex-wrap items-center gap-4">
          <label className="font-medium text-stone-700">Number of tables to generate:</label>
          <input type="number" min="1" max="50" value={tableCount}
            onChange={(e) => setTableCount(Number(e.target.value))}
            className="border border-stone-300 rounded-lg p-2 w-24 focus:ring-emerald-500 focus:border-emerald-500 text-center font-bold" />
          <button onClick={() => window.print()} className="bg-stone-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-stone-900 transition shadow-sm">Print All</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {qrs.map((q) => (
            <div key={q.table} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 text-center flex flex-col items-center hover:shadow-md transition">
              <h3 className="font-serif font-bold text-xl text-stone-800 mb-4">Table {q.table}</h3>
              <div className="bg-stone-50 p-2 rounded-xl border border-stone-100 mb-4">
                <img src={q.dataUrl} alt={`QR Table ${q.table}`} className="w-40 h-40" />
              </div>
              <p className="text-[10px] text-stone-400 break-all font-mono bg-stone-50 p-2 rounded w-full">{q.url}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
