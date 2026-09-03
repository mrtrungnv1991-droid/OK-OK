import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// API Routers
import { authRouter } from './server/routes/api/v1/authRoutes';
import { productRouter } from './server/routes/api/v1/productRoutes';
import { gameRouter } from './server/routes/api/v1/gameRoutes';
import { orderRouter } from './server/routes/api/v1/orderRoutes';
import { walletRouter } from './server/routes/api/v1/walletRoutes';
import { escrowRouter } from './server/routes/api/v1/escrowRoutes';
import { reviewRouter } from './server/routes/api/v1/reviewRoutes';
import { adminRouter } from './server/routes/api/v1/adminRoutes';
import { notificationRouter } from './server/routes/api/v1/notificationRoutes';
import { affiliateRouter } from './server/routes/api/v1/affiliateRoutes';
import { webhookRouter } from './server/routes/api/v1/webhookRoutes';
import { sourceAutomationRouter } from './server/routes/api/v1/sourceAutomationRoutes';
import { sourceConnectorRouter } from './server/routes/api/v1/sourceConnectorRoutes';
import { reliableOrderRouter } from './server/routes/api/v1/reliableOrderRoutes';
import { paymentRouter } from './server/routes/api/v1/paymentRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic API Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CYBERPOOL Production Backend API v1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Mount API v1 Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/games', gameRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/wallet', walletRouter);
  app.use('/api/v1/escrow', escrowRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/affiliate', affiliateRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1/source-automation', sourceAutomationRouter);
  app.use('/api/v1/source-connector', sourceConnectorRouter);
  app.use('/api/v1/reliable-orders', reliableOrderRouter);
  app.use('/api/v1/payments', paymentRouter);

  // Vite middleware for development vs Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ [CYBERPOOL BACKEND] Running at http://0.0.0.0:${PORT}`);
    console.log(`🚀 [API v1] Mounted: /api/v1/auth, /api/v1/wallet, /api/v1/orders, /api/v1/escrow, /api/v1/admin`);
  });
}

startServer();
