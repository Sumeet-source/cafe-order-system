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
        const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 1 });
        out.push({ table: i, dataUrl, url });
      }
      setQrs(out);
    };
    generate();
  }, [tableCount, baseUrl]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Table QR Codes</h1>
        <a href="/admin/dashboard" className="text-amber-800 underline text-sm">← Dashboard</a>
      </header>

      <div className="mb-6 flex items-center gap-3">
        <label>Number of tables:</label>
        <input type="number" min="1" max="50" value={tableCount}
          onChange={(e) => setTableCount(Number(e.target.value))}
          className="border rounded p-2 w-24" />
        <button onClick={() => window.print()} className="bg-amber-700 text-white px-4 py-2 rounded">Print</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {qrs.map((q) => (
          <div key={q.table} className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="font-bold mb-2">Table {q.table}</h3>
            <img src={q.dataUrl} alt={`QR Table ${q.table}`} className="mx-auto" />
            <p className="text-xs text-gray-500 mt-2 break-all">{q.url}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
