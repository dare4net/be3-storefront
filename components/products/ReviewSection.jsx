"use client";

import { useState, useEffect, useCallback } from 'react';
import { Star, ThumbsUp, CheckCircle2, ShieldAlert, Send, Pencil, Trash2, ChevronDown, ImagePlus, X, MessageSquare, Store, Reply } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/components/providers/AuthContext';
import { useTenant } from '@/components/providers/TenantContext';

export default function ReviewSection({ productId, ratingSummary: initialSummary }) {
    const { user, isAuthenticated } = useAuth();
    const tenant = useTenant();

    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(initialSummary || null);
    const [myRating, setMyRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    // Review form state
    const [formTitle, setFormTitle] = useState('');
    const [formBody, setFormBody] = useState('');
    const [formMediaUrls, setFormMediaUrls] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [isProductOwner, setIsProductOwner] = useState(false);
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyBody, setReplyBody] = useState('');

    const headers = { 'X-Tenant-ID': tenant?.id };

    const fetchReviews = useCallback(async (p = 1) => {
        if (!tenant?.id || !productId) return;
        try {
            const res = await api.get(`/reviews/product/${productId}?page=${p}&per_page=10`, {
                headers: { ...headers, ...(user?.id ? { 'x-user-id': user.id } : {}) }
            });
            if (res.data.success) {
                setReviews(p === 1 ? res.data.reviews : prev => [...prev, ...res.data.reviews]);
                setSummary(res.data.summary);
                setTotalPages(res.data.pagination.totalPages);
                setPage(p);
                if (res.data.is_product_owner !== undefined) {
                    setIsProductOwner(res.data.is_product_owner);
                }
            }
        } catch (e) {
            console.error('[Reviews] Failed to fetch:', e);
        } finally {
            setLoading(false);
        }
    }, [tenant?.id, productId, user?.id]);

    const fetchMyRating = useCallback(async () => {
        if (!isAuthenticated || !tenant?.id) return;
        try {
            const res = await api.get(`/reviews/ratings/${productId}/mine`, { headers });
            if (res.data.success) setMyRating(res.data.rating);
        } catch (e) { /* no rating yet */ }
    }, [isAuthenticated, tenant?.id, productId]);

    useEffect(() => {
        fetchReviews(1);
        fetchMyRating();
    }, [fetchReviews, fetchMyRating]);

    const handleRate = async (rating) => {
        if (!isAuthenticated) return alert('Please login to rate this product');
        try {
            await api.put(`/reviews/ratings/${productId}`, { rating }, { headers });
            setMyRating({ rating });
            fetchReviews(1); // refresh to update summary
        } catch (e) {
            alert(e.response?.data?.message || e.response?.data?.error || 'Failed to rate');
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return alert('Please login to write a review');
        if (!formBody.trim()) return;
        setSubmitting(true);
        try {
            if (editingReviewId) {
                await api.patch(`/reviews/${editingReviewId}`, {
                    title: formTitle || null,
                    body: formBody,
                    media_urls: formMediaUrls
                }, { headers });
            } else {
                await api.post(`/reviews/${productId}`, {
                    title: formTitle || null,
                    body: formBody,
                    media_urls: formMediaUrls
                }, { headers });
            }
            setFormTitle(''); setFormBody(''); setFormMediaUrls([]);
            setShowForm(false); setEditingReviewId(null);
            fetchReviews(1);
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!confirm('Delete this review?')) return;
        try {
            await api.delete(`/reviews/${reviewId}`, { headers });
            fetchReviews(1);
        } catch (e) {
            alert('Failed to delete review');
        }
    };

    const handleEditReview = (review) => {
        setEditingReviewId(review.id);
        setFormTitle(review.title || '');
        setFormBody(review.body || '');
        setFormMediaUrls(review.media?.map(m => m.url) || []);
        setShowForm(true);
    };

    const handleVote = async (reviewId) => {
        if (!isAuthenticated) return alert('Please login to vote');
        try {
            const res = await api.post(`/reviews/${reviewId}/vote`, {}, { headers });
            // Update local state
            setReviews(prev => prev.map(r => {
                if (r.id === reviewId) {
                    return {
                        ...r,
                        user_has_voted: res.data.voted,
                        helpful_count: parseInt(r.helpful_count) + (res.data.voted ? 1 : -1)
                    };
                }
                return r;
            }));
        } catch (e) {
            console.error('Vote failed:', e);
        }
    };

    const handleReply = async (reviewId) => {
        if (!replyBody.trim()) return;
        try {
            await api.post(`/reviews/${reviewId}/reply`, { body: replyBody }, { headers });
            setReplyingToId(null);
            setReplyBody('');
            fetchReviews(1);
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to post reply');
        }
    };

    const ratingCounts = summary ? [
        { stars: 5, count: parseInt(summary.rating_5 || 0) },
        { stars: 4, count: parseInt(summary.rating_4 || 0) },
        { stars: 3, count: parseInt(summary.rating_3 || 0) },
        { stars: 2, count: parseInt(summary.rating_2 || 0) },
        { stars: 1, count: parseInt(summary.rating_1 || 0) },
    ] : [];
    const totalRatings = parseInt(summary?.total_ratings || 0);

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Customer Reviews</h2>
                {isAuthenticated && (
                    <button
                        onClick={() => { setEditingReviewId(null); setFormTitle(''); setFormBody(''); setFormMediaUrls([]); setShowForm(!showForm); }}
                        className="text-xs text-blue-600 font-semibold border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                    >
                        + Write a Review
                    </button>
                )}
            </div>

            {/* Rating Summary */}
            <div className="px-6 py-5 flex gap-8 items-center border-b border-gray-100">
                <div className="text-center flex-shrink-0">
                    <p className="text-5xl font-bold text-gray-900">
                        {parseFloat(summary?.average_rating || 0).toFixed(1)}
                    </p>
                    <div className="flex justify-center text-yellow-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(summary?.average_rating || 0)) ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 space-y-1.5">
                    {ratingCounts.map(({ stars, count }) => {
                        const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                        return (
                            <div key={stars} className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="w-5 text-right">{stars}</span>
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-7">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Your Rating (only for authenticated users) */}
            {isAuthenticated && (
                <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/30">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => handleRate(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-0.5 transition-transform hover:scale-110"
                                >
                                    <Star className={`w-5 h-5 transition-colors ${
                                        star <= (hoverRating || myRating?.rating || 0)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                    }`} />
                                </button>
                            ))}
                        </div>
                        {myRating?.rating && (
                            <span className="text-xs text-gray-500">({myRating.rating}/5)</span>
                        )}
                    </div>
                </div>
            )}

            {/* Review Form */}
            {showForm && (
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-900">
                            {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
                        </h3>
                        <input
                            type="text"
                            placeholder="Review title (optional)"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                        <textarea
                            placeholder="Share your experience..."
                            value={formBody}
                            onChange={(e) => setFormBody(e.target.value)}
                            rows={3}
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                        />
                        {/* Media preview */}
                        {formMediaUrls.length > 0 && (
                            <div className="flex gap-2">
                                {formMediaUrls.map((url, i) => (
                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormMediaUrls(prev => prev.filter((_, j) => j !== i))}
                                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting || !formBody.trim()}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Send className="w-3 h-3" />
                                {submitting ? 'Submitting...' : editingReviewId ? 'Update' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Individual Reviews */}
            <div className="divide-y divide-gray-100">
                {loading && reviews.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-gray-400">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                        <p className="text-sm text-gray-400">No reviews yet. Be the first to share your experience!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="px-6 py-5">
                            {/* Stars + Date */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < (review.author_rating || 0) ? 'fill-current' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400">
                                    {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>

                            {/* Title + Body */}
                            {review.title && <h4 className="font-semibold text-gray-900 text-sm mb-1">{review.title}</h4>}
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.body}</p>

                            {/* Media thumbnails */}
                            {review.media && review.media.length > 0 && (
                                <div className="flex gap-2 mb-3">
                                    {review.media.map((m) => (
                                        <img key={m.id} src={m.url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                                    ))}
                                </div>
                            )}

                            {/* Author + Badge */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium text-gray-800">
                                        {review.first_name || 'Anonymous'} {review.last_name ? review.last_name.charAt(0) + '.' : ''}
                                    </span>
                                    <span className="text-gray-200">•</span>
                                    {review.is_vendor ? (
                                        <span className="text-purple-600 font-medium flex items-center gap-1">
                                            <Store className="w-3 h-3" /> Vendor
                                        </span>
                                    ) : review.is_verified_purchase ? (
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 font-medium flex items-center gap-1">
                                            <ShieldAlert className="w-3 h-3" /> Unverified
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Helpful vote */}
                                    <button
                                        onClick={() => handleVote(review.id)}
                                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                                            review.user_has_voted
                                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        <ThumbsUp className="w-3 h-3" />
                                        <span>{parseInt(review.helpful_count || 0)}</span>
                                    </button>

                                    {/* Edit/Delete own */}
                                    {review.is_own && (
                                        <>
                                            <button onClick={() => handleEditReview(review)} className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleDeleteReview(review.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Vendor Reply */}
                            {review.vendor_reply && (
                                <div className="mt-3 ml-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <MessageSquare className="w-3 h-3 text-blue-600" />
                                        <span className="text-xs font-semibold text-blue-600">
                                            {review.vendor_reply.vendor_name || 'Seller'} replied
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{review.vendor_reply.body}</p>
                                </div>
                            )}

                            {/* Vendor Reply Button (only for product owner, no existing reply) */}
                            {isProductOwner && !review.vendor_reply && !review.is_own && (
                                <div className="mt-3">
                                    {replyingToId === review.id ? (
                                        <div className="ml-4 space-y-2">
                                            <textarea
                                                placeholder="Write your reply as the seller..."
                                                value={replyBody}
                                                onChange={(e) => setReplyBody(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => { setReplyingToId(null); setReplyBody(''); }}
                                                    className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReply(review.id)}
                                                    disabled={!replyBody.trim()}
                                                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    <Send className="w-3 h-3" /> Reply
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setReplyingToId(review.id)}
                                            className="ml-4 flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
                                        >
                                            <Reply className="w-3 h-3" /> Reply as seller
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Load More */}
            {page < totalPages && (
                <div className="px-6 py-4 border-t border-gray-100 text-center">
                    <button
                        onClick={() => fetchReviews(page + 1)}
                        className="text-xs text-blue-600 font-semibold flex items-center gap-1 mx-auto hover:text-blue-700 transition-colors"
                    >
                        <ChevronDown className="w-4 h-4" /> Load More Reviews
                    </button>
                </div>
            )}
        </div>
    );
}
