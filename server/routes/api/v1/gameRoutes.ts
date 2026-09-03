import { Router } from 'express';
import { db } from '../../../db/store';

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
