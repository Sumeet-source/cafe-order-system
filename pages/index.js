import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold mb-3">☕ Cafe Order System</h1>
      <p className="text-gray-600 mb-8">QR-powered table ordering</p>
      <div className="flex gap-4">
        <Link href="/order?table=1" className="bg-amber-700 text-white px-6 py-3 rounded-lg font-medium">
          Demo Customer Menu (Table 1)
        </Link>
        <Link href="/admin/login" className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium">
          Admin Login
        </Link>
      </div>
    </div>
  );
}
