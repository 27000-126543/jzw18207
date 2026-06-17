import { Router, Request, Response } from 'express';
import { QRCodeRepository } from '../repositories/QRCodeRepository';
import { QRCodeService } from '../services/QRCodeService';
import { ScanRepository } from '../repositories/ScanRepository';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, status, type, keyword, tag, page = '1', pageSize = '20' } = req.query;
    const result = await QRCodeRepository.list({
      projectId: projectId as string,
      status: status as string,
      type: type as string,
      keyword: keyword as string,
      tag: tag as string,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batch-generate', async (req: Request, res: Response) => {
  try {
    const result = await QRCodeService.batchGenerate(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { ids, action, payload } = req.body;
    if (action === 'disable') {
      await QRCodeRepository.batchUpdate(ids, { status: 'disabled' });
    } else if (action === 'enable') {
      await QRCodeRepository.batchUpdate(ids, { status: 'active' });
    } else if (action === 'delete') {
      await QRCodeRepository.batchDelete(ids);
    } else if (action === 'updateUrl') {
      await QRCodeRepository.batchUpdate(ids, { target_url: payload?.targetUrl });
    } else if (action === 'extend') {
      await QRCodeRepository.batchUpdate(ids, { expiration_date: payload?.expirationDate });
    } else if (action === 'updateTags') {
      await QRCodeRepository.batchUpdate(ids, { tags: payload?.tags });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/download/:token', async (req: Request, res: Response) => {
  try {
    const filePath = await QRCodeService.getDownloadPath(req.params.token);
    if (!filePath) return res.status(404).json({ error: 'Not found' });
    res.download(filePath, 'qrcodes.zip');
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/change-logs', async (req: Request, res: Response) => {
  try {
    const { UrlChangeLogRepository } = await import('../repositories/UrlChangeLogRepository');
    const logs = await UrlChangeLogRepository.findByQRCodeId(req.params.id);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const qr = await QRCodeRepository.findById(req.params.id);
    if (!qr) return res.status(404).json({ error: 'Not found' });
    res.json(qr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/image', async (req: Request, res: Response) => {
  try {
    const filePath = await QRCodeService.getQRCodeImagePath(req.params.id);
    if (!filePath) return res.status(404).json({ error: 'Not found' });
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/scans', async (req: Request, res: Response) => {
  try {
    const logs = await ScanRepository.listByQRCode(req.params.id, 100);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const qr = await QRCodeRepository.update(req.params.id, req.body);
    if (!qr) return res.status(404).json({ error: 'Not found' });
    res.json(qr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await QRCodeRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
