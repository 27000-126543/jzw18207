import { Router, Request, Response } from 'express';
import { ScanRepository } from '../repositories/ScanRepository';

const router = Router();

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { qrcodeId, projectId, startDate, endDate } = req.query;
    const summary = await ScanRepository.getSummary({
      qrcodeId: qrcodeId as string,
      projectId: projectId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trend', async (req: Request, res: Response) => {
  try {
    const { qrcodeId, projectId, period = 'day' } = req.query;
    const data = await ScanRepository.getTrend({
      qrcodeId: qrcodeId as string,
      projectId: projectId as string,
      period: period as 'day' | 'week' | 'month',
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/geo', async (req: Request, res: Response) => {
  try {
    const { qrcodeId, projectId } = req.query;
    const data = await ScanRepository.getGeo({
      qrcodeId: qrcodeId as string,
      projectId: projectId as string,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/devices', async (req: Request, res: Response) => {
  try {
    const { qrcodeId, projectId, field = 'device_type' } = req.query;
    const data = await ScanRepository.getByDeviceField({
      qrcodeId: qrcodeId as string,
      projectId: projectId as string,
      field: field as 'device_type' | 'os' | 'browser',
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
