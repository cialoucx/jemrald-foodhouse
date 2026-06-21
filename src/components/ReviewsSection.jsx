import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ReviewsSection() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load reviews from Supabase
  useEffect(() => {
    async function loadReviews() {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setReviews(data);
      setLoading(false);
    }
    loadReviews();

    // Subscribe to new reviews
    const subscription = supabase
      .channel('public:reviews')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        (payload) => {
          setReviews((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Global event listener for modal
  useEffect(() => {
    const handleOpen = () => {
      setIsModalOpen(true);
      setRating(0);
      setReviewText('');
    };
    document.addEventListener('open-review', handleOpen);
    return () => document.removeEventListener('open-review', handleOpen);
  }, []);

  const handleWriteClick = () => {
    if (!user) {
      showToast('Please sign in to leave a review.', true);
      document.dispatchEvent(new CustomEvent('open-auth'));
      return;
    }
    setIsModalOpen(true);
    setRating(0);
    setReviewText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (rating === 0) {
      showToast('Please select a star rating.', true);
      return;
    }
    if (!reviewText.trim()) {
      showToast('Please write a short review.', true);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert([
        {
          user_name: user.name,
          user_email: user.email,
          rating,
          text: reviewText,
        },
      ]);

      if (error) throw error;

      setIsModalOpen(false);
      showToast('Thanks for your review! 🌟');
    } catch (err) {
      showToast(err.message || 'Failed to post review', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const avg =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  return (
    <>
      <div
        className="reviews-section reviews-section-inner"
        style={{ padding: '60px 40px 40px', borderTop: '1px solid var(--border)' }}
      >
        <div
          className="reviews-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div className="section-title" style={{ margin: 0 }}>
            Customer Reviews
          </div>
          <motion.button
            whileHover={{ scale: 1.05, borderColor: 'var(--red)', color: 'var(--cream)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWriteClick}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.75rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '10px 22px',
              borderRadius: '6px',
            }}
          >
            Write a Review
          </motion.button>
        </div>

        <div
          className="reviews-summary"
          style={{
            display: 'flex',
            gap: '40px',
            marginBottom: '40px',
            padding: '30px',
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              paddingRight: '40px',
              borderRight: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '4rem',
                fontWeight: 900,
                color: 'var(--red-bright)',
                lineHeight: 1,
              }}
            >
              {avg}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '4px',
                margin: '8px 0',
                color: 'var(--red)',
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i <= Math.round(avg) ? 'var(--red)' : 'none'}
                  color="var(--red)"
                />
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Based on {reviews.length} reviews
            </div>
          </div>
          <div
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <p
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '1.2rem',
                fontStyle: 'italic',
                color: 'var(--cream)',
              }}
            >
              "
              {reviews.length > 0
                ? reviews[0].text
                : 'Consistently the best Japanese cuisine experience in the city. The freshness is unmatched.'}
              "
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            Loading reviews...
          </div>
        ) : (
          <div
            className="reviews-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border2)',
                  padding: '24px',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(154,174,71,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--red-bright)',
                        fontWeight: 700,
                      }}
                    >
                      {r.user_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--cream)' }}>
                        {r.user_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', color: 'var(--red)' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        fill={star <= r.rating ? 'var(--red)' : 'none'}
                        color="var(--red)"
                      />
                    ))}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--cream)',
                    opacity: 0.8,
                    lineHeight: 1.6,
                  }}
                >
                  "{r.text}"
                </p>
              </motion.div>
            ))}
            {reviews.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  padding: '40px',
                }}
              >
                No reviews yet. Be the first to leave one!
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{
              alignItems: 'center',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal"
              style={{ width: '480px', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>

              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '1.6rem',
                  marginBottom: '8px',
                }}
              >
                Rate Your Experience
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '24px' }}>
                How was the food and presentation?
              </p>

              <form onSubmit={handleSubmit}>
                <div
                  style={{ display: 'flex', gap: '8px', cursor: 'pointer', marginBottom: '24px' }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.div
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        size={32}
                        fill={star <= (hoverRating || rating) ? 'var(--red)' : 'none'}
                        color={star <= (hoverRating || rating) ? 'var(--red)' : 'var(--muted)'}
                        style={{ transition: 'color 0.2s' }}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label>Your Review</label>
                  <textarea
                    rows="4"
                    placeholder="Tell us what you loved..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
