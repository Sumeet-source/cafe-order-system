import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Success() {
  const router = useRouter();
  const { table } = router.query;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-stone-100">
        <div className="text-6xl mb-6">☕</div>
        <h1 className="text-3xl font-serif font-bold text-stone-800 mb-3">Order Placed!</h1>
        <p className="text-stone-600 mb-8 leading-relaxed">
          Your order has been sent to the kitchen.<br />
          We'll call you at <span className="font-bold text-emerald-700">Table {table || ''}</span> when it's ready.
        </p>
        <Link href={`/order?table=${table || 1}`} className="block w-full bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold hover:bg-emerald-800 transition shadow-md">
          Order More
        </Link>
      </div>
    </div>
  );
}
