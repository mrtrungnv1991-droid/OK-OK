import { Router } from 'express';
import { db } from '../../../db/store';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { ServerReview } from '../../../types';

export const reviewRouter = Router();

// GET /api/v1/reviews/product/:productId
reviewRouter.get('/product/:productId', (req, res) => {
  const reviews = db.reviews.filter(r => r.productId === req.params.productId);
  res.json({
    success: true,
    reviews
  });
});

// POST /api/v1/reviews - Submit Review with strict server verification
reviewRouter.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const { productId, rating, comment, orderId } = req.body;

  if (!productId || !rating) {
    return res.status(400).json({ success: false, error: 'productId and rating are required' });
  }

  // Server-side check: Did this user actually buy this product and complete the order?
  let isVerified = false;
  for (const order of db.orders.values()) {
    if (order.buyerId === req.user!.id && (order.productId === productId || order.id === orderId) && order.status === 'COMPLETED') {
      isVerified = true;
      break;
    }
  }

  const newReview: ServerReview = {
    id: `rev-${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    productId,
    orderId: orderId || 'ord-verified',
    rating: Number(rating),
    comment: comment || 'Đã kích hoạt bản quyền thành công!',
    verifiedPurchase: isVerified,
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);

  // Update product average rating
  const product = db.products.find(p => p.id === productId);
  if (product) {
    const productReviews = db.reviews.filter(r => r.productId === productId);
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    product.rating = Number((sum / productReviews.length).toFixed(1));
    product.reviewCount = productReviews.length;
  }

  res.json({
    success: true,
    review: newReview
  });
});
