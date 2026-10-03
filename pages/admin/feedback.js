import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from '../../components/ThemeToggle';
import AdminNav from '../../components/AdminNav';
import LogoutButton from '../../components/LogoutButton';

export default function AdminFeedback() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchFeedback = async () => {
      const res = await fetch('/api/feedback');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
      setAvgRating(data.avgRating || 0);
      setTotalReviews(data.totalReviews || 0);
      setDistribution(data.distribution || {});
      setLoading(false);
    };
    fetchFeedback();
  }, [router]);

  const filteredFeedbacks = filter === 'ALL' ? feedbacks : feedbacks.filter(f => f.rating === Number(filter));
  const starDisplay = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const ratingStyle = (r) => {
    if (r >= 4) return 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30';
    if (r === 3) return 'bg-amber-400/20 text-amber-200 border-amber-300/30';
    return 'bg-red-400/20 text-red-200 border-red-300/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-6">
          <p className="text-white/90 animate-pulse">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-950 to-emerald-900 relative overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-15 pointer-events-none"></div>

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="px-4 py-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="House Bird Cafe" className="w-10 h-10 rounded-full bg-white/90 p-0.5 flex-shrink-0 ring-2 ring-white/20 shadow-lg" />
            <h1 className="text-base sm:text-xl font-serif font-bold text-white truncate">
              <span className="hidden sm:inline">House Bird Cafe · Feedback</span>
              <span className="sm:hidden">Feedback</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <AdminNav />
      </header>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 shadow-2xl shadow-amber-500/30">
            <p className="text-xs font-bold text-white/90 uppercase tracking-wide">Average Rating</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-5xl font-bold text-white">{avgRating}</p>
              <p className="text-2xl mb-2 text-white/80">/ 5</p>
            </div>
            <div className="text-2xl mt-1 text-white">★★★★★</div>
            <p className="text-xs mt-2 text-white/80">{totalReviews} total reviews</p>
          </div>

          <div className="md:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase text-white/60 mb-4">Rating Distribution</p>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                const grad = star >= 4 ? 'from-emerald-400 to-teal-500' : star === 3 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500';
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white w-10">{star} ★</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-2.5 rounded-full bg-gradient-to-r ${grad} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white/70 w-16 text-right">{count} ({Math.round(pct)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-xl font-bold text-xs transition border ${filter === 'ALL' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'}`}>
            All ({feedbacks.length})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button key={star} onClick={() => setFilter(star)} className={`px-4 py-2 rounded-xl font-bold text-xs transition border ${filter === star ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/30' : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'}`}>
              {star} ★ ({distribution[star] || 0})
            </button>
          ))}
        </div>

        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-12 text-center text-white/50">
            {feedbacks.length === 0 ? 'No feedback yet' : 'No feedback matches this filter'}
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filteredFeedbacks.map((f) => (
              <div key={f._id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-5 shadow-2xl hover:bg-white/15 transition">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{f.customerName}</span>
                      <span className="text-[10px] text-white/50 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">Table {f.tableNumber}</span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1">
                      {new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(f.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border flex-shrink-0 ${ratingStyle(f.rating)}`}>
                    {starDisplay(f.rating)}
                  </span>
                </div>

                {f.tags && f.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {f.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                    ))}
                  </div>
                )}

                {f.comment && (
                  <p className="text-white/85 text-sm bg-white/5 border-l-4 border-amber-400 rounded-r-xl p-3 italic">
                    "{f.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}