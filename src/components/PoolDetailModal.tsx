import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Gift, 
  UserPlus, 
  ArrowRight,
  Star,
  MessageSquare,
  ThumbsUp,
  Award,
  Send
} from 'lucide-react';
import { Product, GroupPool, UserProfile, ProductReview } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { useUI } from '../contexts/UIContext';

interface PoolDetailModalProps {
  product: Product;
  pool: GroupPool;
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onConfirmJoin: (product: Product, pool: GroupPool) => void;
  onSimulateAddParticipant: (poolId: string) => void;
  onOpenWallet: () => void;
  onRateProduct?: (productId: string, rating: number, comment?: string) => void;
  onInstantBuy?: (product: Product) => void;
}

export const PoolDetailModal: React.FC<PoolDetailModalProps> = ({
  product,
  pool,
  user,
  isOpen,
  onClose,
  onConfirmJoin,
  onSimulateAddParticipant,
  onOpenWallet,
  onRateProduct,
  onInstantBuy
}) => {
  const { t } = useTranslation();
  const { showToast } = useUI();
  const [activeTab, setActiveTab] = useState<'slots' | 'reviews'>('slots');
  const [selectedSlotCount, setSelectedSlotCount] = useState(1);
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSubmittedToast, setReviewSubmittedToast] = useState<boolean>(false);

  const isJoined = pool.participants.some(p => p.id === user.id || p.name.includes(user.name));
  const isFull = pool.filledSlots >= pool.targetSlots;
  const remainingSlots = pool.targetSlots - pool.filledSlots;
  const totalCost = pool.pricePerSlot * selectedSlotCount;
  const hasEnoughBalance = user.walletBalance >= totalCost;

  const reviewsList = product.userReviews || [];
  const averageRating = product.rating || 5.0;
  const totalReviewCount = product.reviewCount || reviewsList.length || 0;

  if (!isOpen) return null;

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRateProduct) return;
    setIsSubmittingReview(true);

    onRateProduct(product.id, userRating, reviewComment);
    setReviewComment('');
    setIsSubmittingReview(false);
    showToast(`Đã gửi đánh giá ${userRating}⭐ cho ${product.name}!`, 'success', {
      title: '✓ ĐÁNH GIÁ THÀNH CÔNG'
    });
    setReviewSubmittedToast(true);
    setTimeout(() => setReviewSubmittedToast(false), 3500);
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1: return '1 Star - Needs Improvement';
      case 2: return '2 Stars - Fair';
      case 3: return '3 Stars - Good';
      case 4: return '4 Stars - Very Good & Reliable';
      case 5: return '5 Stars - Excellent Quality!';
      default: return '';
    }
  };

  const quickTags = [
    'Instant Key Delivery ⚡',
    'Escrow Protected 🛡️',
    'Great Wholesale Price 💰',
    'Smooth & No Errors 🚀',
    '24/7 Fast Support 💬'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl bg-[#0c0f17] border border-slate-700 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#0e1422] to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  POOL #{pool.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('pools.expires_in')}: {pool.expiresAt}
                </span>
                {/* Rating Badge in Header */}
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center gap-1 hover:bg-amber-900/60 transition-colors cursor-pointer"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{averageRating}</span>
                  <span className="text-slate-400">({totalReviewCount} {t('product.reviews_count', { count: totalReviewCount })})</span>
                </button>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                {product.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-[#090c14] px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('slots')}
            className={`py-3 px-4 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'slots'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('pools.slots')} ({pool.filledSlots}/{pool.targetSlots})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-amber-400 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{t('product.reviews_tab')} ({totalReviewCount})</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[68vh] overflow-y-auto">
          {activeTab === 'slots' ? (
            <>
              {/* Top Banner & Fast Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">{t('pools.pool_price')}</div>
                  <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                    {formatCurrency(pool.pricePerSlot, user.currency)}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    {t('pools.save_percent', { percent: pool.savingsPercent })}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">{t('pools.slots')}</div>
                  <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                    {pool.filledSlots} / {pool.targetSlots} Slots
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                    {remainingSlots > 0 ? t('pools.need_more', { count: remainingSlots }) : t('pools.full')}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">{t('hero.escrow_guarantee')}</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Escrow Vault 100%
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {t('escrow.auto_refund')}
                  </div>
                </div>
              </div>

              {/* Slot Visualization Board */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold font-mono text-white">
                      {t('pools.participants')} ({pool.filledSlots}/{pool.targetSlots})
                    </h3>
                  </div>

                  {/* Simulation Helper */}
                  <button
                    onClick={() => onSimulateAddParticipant(pool.id)}
                    disabled={isFull}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-cyan-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Simulate Buyer Join</span>
                  </button>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: pool.targetSlots }).map((_, index) => {
                    const participant = pool.participants[index];
                    const isOccupied = !!participant;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                          isOccupied
                            ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                            : 'bg-slate-950/60 border-dashed border-slate-800'
                        }`}
                      >
                        {isOccupied ? (
                          <>
                            <img
                              src={participant.avatar}
                              alt={participant.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-cyan-400"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold font-mono text-white truncate flex items-center gap-1">
                                <span>{participant.name}</span>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>Slot #{index + 1}</span>
                                <span>•</span>
                                <span className="text-cyan-400">{participant.joinedAt}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs">
                              #{index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-mono text-slate-500 font-medium">Empty Slot</div>
                              <div className="text-[10px] font-mono text-cyan-400">Waiting for you...</div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input & Output Transparent Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs">
                <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-800 pb-2 md:pb-0 md:pr-3">
                  <div className="text-cyan-400 font-bold uppercase flex items-center gap-1.5 text-[11px]">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span>📥 INPUT</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Reserve 1 slot with <strong>{formatCurrency(pool.pricePerSlot, user.currency)}</strong>. Funds are 100% locked securely in the Escrow vault.
                  </p>
                </div>

                <div className="space-y-1 md:pl-3">
                  <div className="text-emerald-400 font-bold uppercase flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>📤 OUTPUT</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    • <strong>Full {pool.targetSlots} slots:</strong> Automatic instant key delivery into your <strong>Key Vault</strong>.
                    <br />• <strong>Pool expires incomplete:</strong> Automatic 100% instant refund to your wallet.
                  </p>
                </div>
              </div>

              {/* Delivery & Escrow Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    <span>{t('product.delivery')}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans text-xs">
                    {product.deliveryEstimate}. Automatic key delivery directly to your Key Vault upon pool completion.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>{t('escrow.title')}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans text-xs">
                    {formatCurrency(pool.pricePerSlot, user.currency)} is securely held by Escrow. Sellers only receive payout after key verification.
                  </p>
                </div>
              </div>

              {/* Product Features Checklist */}
              <div className="space-y-2">
                <div className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                  {t('product.features')}:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900/40 p-2 rounded border border-slate-800/60">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* REVIEWS & STAR RATING TAB */
            <div className="space-y-6">
              {/* Rating Summary Card */}
              <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-r from-[#111625] via-slate-900 to-[#111625] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-center sm:text-left">
                    <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                      <span>{averageRating}</span>
                      <span className="text-lg text-slate-500 font-normal">/5.0</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 mt-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(averageRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      Based on {totalReviewCount} verified reviews
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full max-w-xs space-y-1 text-xs font-mono">
                  {[5, 4, 3, 2, 1].map(stars => {
                    const countForStar = reviewsList.filter(r => Math.round(r.rating) === stars).length;
                    const pct = totalReviewCount > 0 ? Math.round((countForStar / Math.max(reviewsList.length, 1)) * 100) : (stars === 5 ? 90 : 10);
                    return (
                      <div key={stars} className="flex items-center gap-2 text-slate-400">
                        <span className="w-10 text-right">{stars} star</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${stars === 5 ? (totalReviewCount > 0 ? 85 : 95) : pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-slate-500 text-[10px]">{stars === 5 ? '92%' : `${pct}%`}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-center sm:text-right shrink-0">
                  <div className="flex items-center justify-center sm:justify-end gap-1 text-emerald-400 font-mono font-bold text-xs">
                    <Award className="w-4 h-4" />
                    <span>100% Verified Buyer</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Reviews from verified transactions
                  </div>
                </div>
              </div>

              {/* Submit Review Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Leave Your Review</span>
                  </h3>
                  {reviewSubmittedToast && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 animate-pulse">
                      ✓ Review submitted successfully!
                    </span>
                  )}
                </div>

                <form onSubmit={handleSubmitRating} className="space-y-3">
                  {/* Interactive Star Rating Selector */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-slate-400 mr-2">Rating:</span>
                      {[1, 2, 3, 4, 5].map(star => {
                        const isFilled = (hoverRating !== null ? hoverRating : userRating) >= star;
                        return (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setUserRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                            title={`${star} stars`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                  : 'text-slate-600 hover:text-slate-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-xs font-mono font-bold text-amber-300">
                      {getRatingLabel(hoverRating !== null ? hoverRating : userRating)}
                    </div>
                  </div>

                  {/* Quick Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500">Tags:</span>
                    {quickTags.map((tag, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setReviewComment(prev => prev ? `${prev} ${tag}` : tag)}
                        className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <div className="relative">
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with key activation, speed or warranty..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs font-mono text-white placeholder-slate-500 resize-none outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                        alt={user.name}
                        className="w-4 h-4 rounded-full"
                      />
                      <span>Review as: <strong className="text-cyan-400">{user.name}</strong></span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Review ({userRating}⭐)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Reviews Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                    Customer Reviews ({reviewsList.length})
                  </h3>
                </div>

                {reviewsList.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                    <Star className="w-8 h-8 text-amber-400/50 mx-auto" />
                    <p className="text-xs font-mono text-slate-400">
                      No reviews yet. Be the first to review this product!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reviewsList.map(review => (
                      <div
                        key={review.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={review.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                              alt={review.userName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold font-mono text-white">
                                  {review.userName}
                                </span>
                                {review.verifiedPurchase && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {review.createdAt}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs font-sans text-slate-200 leading-relaxed pl-9">
                          {review.comment}
                        </p>

                        <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-slate-500 pl-9">
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Helpful ({review.likes || 0})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Purchase Action */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-[#0a0d14] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-400">
              {t('cart.total')} ({selectedSlotCount} Slot):
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
              {formatCurrency(totalCost, user.currency)}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {t('wallet.balance')}: <span className="text-white font-bold">{formatCurrency(user.walletBalance, user.currency)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {onInstantBuy && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInstantBuy(product);
                }}
                className="py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-mono font-bold text-xs border border-amber-500/40 hover:border-amber-400 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>⚡ {t('product.instant_buy')} ({formatCurrency(product.retailPrice, user.currency)})</span>
              </button>
            )}

            {!hasEnoughBalance ? (
              <button
                onClick={onOpenWallet}
                className="flex-1 sm:flex-initial py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
              >
                {t('wallet.topup_btn')}
              </button>
            ) : (
              <button
                onClick={() => onConfirmJoin(product, pool)}
                disabled={isFull || isJoined}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isJoined ? (
                  <span>Slot Already Reserved</span>
                ) : isFull ? (
                  <span>{t('pools.full')}</span>
                ) : (
                  <>
                    <span>{t('pools.join_btn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
