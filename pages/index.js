import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to the customer menu (default Table 1)
    router.replace('/order?table=1');
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">☕</div>
        <p className="text-stone-500 animate-pulse">Loading menu...</p>
      </div>
    </div>
  );
}
