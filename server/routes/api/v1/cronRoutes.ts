import { Router } from 'express';
import { CronService } from '../../../services/cronService';
import { requireAuth, requireRole } from '../../../middleware/authMiddleware';

export const cronRouter = Router();

// CYBERPOOL SECURITY FIX: cron endpoints can trigger arbitrary jobs and change
// daemon configuration — previously mounted with zero authentication.
cronRouter.use(requireAuth, requireRole('ADMIN'));

// GET /api/v1/cron/status - Get background cron daemon status and logs
cronRouter.get('/status', (req, res) => {
  try {
    const status = CronService.getStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/cron/trigger - Manually run cron immediately
cronRouter.post('/trigger', async (req, res) => {
  try {
    const result = await CronService.tick('manual_admin');
    res.json({ success: true, result, status: CronService.getStatus() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/cron/config - Update cron interval and settings
cronRouter.post('/config', (req, res) => {
  try {
    const { enabled, intervalSeconds, autoHideOutOfStock, notificationOnOutOfStock } = req.body;
    const updated = CronService.updateConfig({
      ...(typeof enabled === 'boolean' ? { enabled } : {}),
      ...(typeof intervalSeconds === 'number' ? { intervalSeconds } : {}),
      ...(typeof autoHideOutOfStock === 'boolean' ? { autoHideOutOfStock } : {}),
      ...(typeof notificationOnOutOfStock === 'boolean' ? { notificationOnOutOfStock } : {})
    });
    res.json({ success: true, data: updated, status: CronService.getStatus() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/cron/ping - Compatibility endpoint for external cron providers (e.g. cron-job.org)
cronRouter.all('/ping', async (req, res) => {
  try {
    const result = await CronService.tick('external_webhook');
    res.json({ success: true, message: 'Cron executed via ping', result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
