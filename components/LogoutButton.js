import { useState } from 'react';
import { useRouter } from 'next/router';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Log out of House Bird Cafe admin?')) return;
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      aria-label="Logout"
      title="Logout"
     className="group relative w-14 h-8 rounded-full border border-red-400/40 bg-gradient-to-r from-red-500/10 to-rose-500/10 backdrop-blur-md hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/60 transition-all duration-300 flex items-center justify-center overflow-hidden disabled:opacity-50"
    >
      {/* Subtle pulsing glow */}
      <span className="absolute inset-0 rounded-full bg-red-500/20 opacity-0 group-hover:opacity-100 group-hover:animate-ping"></span>

      {/* Icon */}
      <LogOut
        size={16}
        strokeWidth={2.5}
        className={`relative text-red-300 group-hover:text-red-200 transition-all duration-300 group-hover:translate-x-0.5 ${
          loading ? 'animate-spin' : ''
        }`}
      />

      {/* Loading overlay */}
      {loading && (
        <span className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse"></span>
      )}
    </button>
  );
}