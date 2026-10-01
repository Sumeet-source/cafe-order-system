import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const QUICK_TAGS = [
  { id: 'taste', label: '😋 Great Taste' },
  { id: 'service', label: '⚡ Fast Service' },
  { id: 'staff', label: '😊 Friendly Staff' },
  { id: 'clean', label: '✨ Clean Space' },
  { id: 'value', label: '💰 Good Value' },
  { id: 'ambience', label: '🎵 Nice Ambience' },
];

export default function Feedback() {
  const router = useRouter();
  const { orderId } = router.query;

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (label) => {
    setSelectedTags(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const submitFeedback = async () => {
    if (rating === 0) return alert('Please select a rating');
    if (!orderId) return alert('Missing order ID');

    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, comment, tags: selectedTags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h1 className="text-3xl font-serif font-bold text-stone-800 mb-3">Thank You!</h1>
          <p className="text-stone-600 mb-6 leading-relaxed">
            Your feedback helps us serve you better.<br />
            We hope to see you again soon!
          </p>
          <div className="text-4xl mb-6">⭐ {rating}/5</div>
          <Link href={`/order?table=1`} className="inline-block w-full bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold hover:bg-emerald-800 transition">
            Order Again
          </Link>
        </div>
      </div>
    );
  }

  const ratingLabels = {
    1: '😞 Poor',
    2: '😐 Okay',
    3: '🙂 Good',
    4: '😊 Very Good',
    5: '🤩 Excellent!',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-stone-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-2xl font-serif font-bold text-stone-800">How was your visit?</h1>
          <p className="text-stone-500 text-sm mt-2">House Bird Cafe</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-5xl transition transform hover:scale-110"
            >
              <span className={star <= (hover || rating) ? 'text-amber-400' : 'text-stone-200'}>
                ★
              </span>
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-lg font-bold text-stone-700 mb-6">
            {ratingLabels[rating]}
          </p>
        )}

        {rating === 0 && (
          <p className="text-center text-sm text-stone-400 mb-6">Tap a star to rate</p>
        )}

        {/* Quick Tags */}
        <div className="mb-6">
          <p className="text-xs font-bold text-stone-500 uppercase mb-2">What did you like?</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.label)}
                className={`text-xs px-3 py-2 rounded-full font-medium transition ${
                  selectedTags.includes(tag.label)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <p className="text-xs font-bold text-stone-500 uppercase mb-2">Any comments? (optional)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Tell us what you loved or what we can improve..."
            className="w-full border border-stone-300 rounded-xl p-3 text-sm focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            maxLength={500}
          />
          <p className="text-right text-[10px] text-stone-400 mt-1">{comment.length}/500</p>
        </div>

        {/* Submit */}
        <button
          onClick={submitFeedback}
          disabled={loading || rating === 0}
          className="w-full bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-800 transition disabled:bg-stone-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>

        <p className="text-center text-xs text-stone-400 mt-4">
          Your feedback is anonymous and helps us improve
        </p>
      </div>
    </div>
  );
}
