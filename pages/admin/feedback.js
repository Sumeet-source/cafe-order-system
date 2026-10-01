import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

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

  const filteredFeedbacks = filter === 'ALL'
    ? feedbacks
    : feedbacks.filter(f => f.rating === Number(filter));

  const starDisplay = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const ratingColor = (r) => {
    if (r >= 4) return 'text-emerald-600 bg-emerald-50';
    if (r === 3) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500 animate-pulse">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <header className="mb-8 max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-800">Customer Feedback</h1>
          <p className="text-stone-500 text-sm mt-1">House Bird Cafe</p>
        </div>
        <a href="/admin/dashboard" className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-900 transition">← Back to Dashboard</a>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Average Rating Card */}
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 rounded-2xl shadow-md text-white">
            <p className="text-xs font-bold uppercase opacity-80">Average Rating</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-5xl font-bold">{avgRating}</p>
              <p className="text-2xl mb-2">/ 5</p>
            </div>
            <div className="text-2xl mt-1">★★★★★</div>
            <p className="text-xs mt-2 opacity-80">{totalReviews} total reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 md:col-span-2">
            <p className="text-xs font-bold uppercase text-stone-500 mb-4">Rating Distribution</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-stone-700 w-16">{star} ★</span>
                    <div className="flex-1 bg-stone-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-stone-500 w-12 text-right">{count} ({Math.round(pct)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg font-bold text-sm ${filter === 'ALL' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>
            All ({feedbacks.length})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setFilter(star)}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${filter === star ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}
            >
              {star} ★ ({distribution[star] || 0})
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-stone-400 border border-stone-200">
            {feedbacks.length === 0 ? 'No feedback yet' : 'No feedback matches this filter'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((f) => (
              <div key={f._id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-stone-800">{f.customerName}</span>
                      <span className="text-xs text-stone-400">Table {f.tableNumber}</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(f.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${ratingColor(f.rating)}`}>
                    {starDisplay(f.rating)}
                  </span>
                </div>

                {f.tags && f.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {f.tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">{tag}</span>
                    ))}
                  </div>
                )}

                {f.comment && (
                  <p className="text-stone-700 text-sm bg-stone-50 p-4 rounded-xl border-l-4 border-amber-400 italic">
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
