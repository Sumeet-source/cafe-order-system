import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Success() {
  const router = useRouter();
  const { table } = router.query;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
      <p className="text-gray-600 mb-6">
        Your order has been sent to the kitchen.<br />
        We'll call you at Table {table || ''} when it's ready.
      </p>
      <Link href={`/order?table=${table || 1}`} className="bg-amber-700 text-white px-6 py-3 rounded-lg font-medium">
        Order More
      </Link>
    </div>
  );
}
