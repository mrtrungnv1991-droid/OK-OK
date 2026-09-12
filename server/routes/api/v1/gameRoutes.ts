import { Router } from 'express';
import { db } from '../../../db/store';
import { GameStorageService } from '../../../services/gameStorageService';
import { requireAuth, requireRole } from '../../../middleware/authMiddleware';
import { GameItem, TopupTier } from '../../../../src/types';

export const gameRouter = Router();

// GET /api/v1/games - Catalog of direct top-up games
gameRouter.get('/', (req, res) => {
  res.json({
    success: true,
    total: db.games.length,
    games: db.games
  });
});

// GET /api/v1/games/:id
gameRouter.get('/:id', (req, res) => {
  const game = db.games.find(g => g.id === req.params.id);
  if (!game) {
    return res.status(404).json({ success: false, error: 'Game not found' });
  }
  res.json({ success: true, game });
});

// CYBERPOOL SECURITY FIX (CRITICAL): toàn bộ route mutating bên dưới trước đây
// KHÔNG có auth — ai cũng POST /games, PUT/DELETE /:id, bulk-adjust (repricing
// cả catalog, vd percentDelta:-90), reset, và thay đổi được ghi thẳng ra đĩa
// (GameStorageService). Giờ mọi mutation yêu cầu ADMIN.
gameRouter.use(requireAuth, requireRole('ADMIN'));

// POST /api/v1/games - Add a new game
gameRouter.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const newGame: GameItem = {
      id: body.id || `game_${Date.now()}`,
      name: body.name || 'Game Mới',
      category: body.category || 'Mobile',
      publisher: body.publisher || 'Nhà phát hành',
      banner: body.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
      thumbnail: body.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop&q=80',
      uidLabel: body.uidLabel || 'Nhập UID',
      uidPlaceholder: body.uidPlaceholder || 'Ví dụ: 801928491',
      description: body.description || 'Nạp game tự động',
      tiers: body.tiers || []
    };

    db.games.unshift(newGame);
    GameStorageService.saveGames(db.games);

    res.json({
      success: true,
      message: 'Thêm tựa game mới thành công',
      game: newGame
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi tạo game' });
  }
});

// PUT /api/v1/games/:id - Update game details
gameRouter.put('/:id', (req, res) => {
  try {
    const gameId = req.params.id;
    const index = db.games.findIndex(g => g.id === gameId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const updated = {
      ...db.games[index],
      ...req.body,
      id: gameId // protect id
    };
    db.games[index] = updated;
    GameStorageService.saveGames(db.games);

    res.json({
      success: true,
      message: 'Cập nhật tựa game thành công',
      game: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi cập nhật game' });
  }
});

// DELETE /api/v1/games/:id - Delete a game permanently
gameRouter.delete('/:id', (req, res) => {
  try {
    const gameId = req.params.id;
    const initialCount = db.games.length;
    db.games = db.games.filter(g => g.id !== gameId);

    if (db.games.length === initialCount) {
      return res.status(404).json({ success: false, error: 'Game not found or already deleted' });
    }

    // Persist to disk
    GameStorageService.saveGames(db.games);

    res.json({
      success: true,
      message: 'Đã xóa vĩnh viễn tựa game thành công',
      deletedId: gameId,
      remaining: db.games.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi xóa game' });
  }
});

// POST /api/v1/games/:id/tiers - Add tier to game
gameRouter.post('/:id/tiers', (req, res) => {
  try {
    const gameId = req.params.id;
    const game = db.games.find(g => g.id === gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const tier: TopupTier = req.body.tier;
    if (!tier || !tier.id) {
      return res.status(400).json({ success: false, error: 'Invalid tier data' });
    }

    game.tiers.push(tier);
    GameStorageService.saveGames(db.games);

    res.json({ success: true, message: 'Đã thêm gói nạp mới', tiers: game.tiers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi thêm gói nạp' });
  }
});

// PUT /api/v1/games/:id/tiers/:tierId - Update tier in game
gameRouter.put('/:id/tiers/:tierId', (req, res) => {
  try {
    const { id: gameId, tierId } = req.params;
    const game = db.games.find(g => g.id === gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const tierIndex = game.tiers.findIndex((t: TopupTier) => t.id === tierId);
    if (tierIndex === -1) {
      return res.status(404).json({ success: false, error: 'Tier not found' });
    }

    game.tiers[tierIndex] = {
      ...game.tiers[tierIndex],
      ...req.body.tier,
      id: tierId
    };
    GameStorageService.saveGames(db.games);

    res.json({ success: true, message: 'Cập nhật gói nạp thành công', tier: game.tiers[tierIndex] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi cập nhật gói' });
  }
});

// DELETE /api/v1/games/:id/tiers/:tierId - Delete tier from game
gameRouter.delete('/:id/tiers/:tierId', (req, res) => {
  try {
    const { id: gameId, tierId } = req.params;
    const game = db.games.find(g => g.id === gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    game.tiers = game.tiers.filter((t: TopupTier) => t.id !== tierId);
    GameStorageService.saveGames(db.games);

    res.json({ success: true, message: 'Đã xóa gói nạp', tiers: game.tiers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi xóa gói' });
  }
});

// POST /api/v1/games/bulk-adjust - Bulk adjust prices
gameRouter.post('/bulk-adjust', (req, res) => {
  try {
    const { gameId, percentDelta } = req.body;
    if (typeof percentDelta !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid percentDelta' });
    }

    const factor = 1 + (percentDelta / 100);

    db.games.forEach(g => {
      if (gameId === 'all' || g.id === gameId) {
        g.tiers = g.tiers.map((t: TopupTier) => ({
          ...t,
          retailPrice: Math.round(t.retailPrice * factor / 1000) * 1000,
          groupPrice: t.groupPrice ? Math.round(t.groupPrice * factor / 1000) * 1000 : undefined
        }));
      }
    });

    GameStorageService.saveGames(db.games);

    res.json({ success: true, message: 'Đã điều chỉnh giá hàng loạt thành công', games: db.games });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi điều chỉnh giá' });
  }
});

// POST /api/v1/games/reset - Reset to factory defaults
gameRouter.post('/reset', (req, res) => {
  try {
    db.games = GameStorageService.resetToDefaults();
    res.json({ success: true, message: 'Đã khôi phục dữ liệu game mặc định', games: db.games });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi khôi phục' });
  }
});
