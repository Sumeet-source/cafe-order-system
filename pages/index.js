import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <div className="z-10 text-center max-w-2xl">
        <h1 className="text-6xl font-serif font-bold text-stone-800 mb-4 tracking-tight">
          House Bird Cafe
        </h1>
        <p className="text-xl text-stone-600 mb-10 font-light">
          Fresh brews, warm vibes, and a seamless QR ordering experience.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/order?table=1" className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-full font-medium shadow-lg transition transform hover:-translate-y-1">
            Customer Menu (Demo)
          </Link>
          <Link href="/admin/login" className="bg-stone-800 hover:bg-stone-900 text-white px-8 py-4 rounded-full font-medium shadow-lg transition transform hover:-translate-y-1">
            Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
