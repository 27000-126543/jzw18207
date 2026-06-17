import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { TemplateRepository } from '../repositories/TemplateRepository';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    res.json(await TemplateRepository.list(category as string));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/export', async (req: Request, res: Response) => {
  try {
    const { templateId, qrcodeIds, format = 'pdf' } = req.body;
    const { TemplateExportService } = await import('../services/TemplateExportService');
    const token = await TemplateExportService.exportWithQRCodes(templateId, qrcodeIds, format);
    res.json({ success: true, downloadToken: token, format });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/download/:token', async (req: Request, res: Response) => {
  try {
    const ext = req.params.token;
    const pdfPath = path.resolve(process.cwd(), 'qr-codes', `${ext}.pdf`);
    const zipPath = path.resolve(process.cwd(), 'qr-codes', `${ext}.zip`);
    if (fs.existsSync(pdfPath)) {
      res.download(pdfPath, 'template-export.pdf');
    } else if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'template-export.zip');
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export-records', async (req: Request, res: Response) => {
  try {
    const { ExportRecordRepository } = await import('../repositories/ExportRecordRepository');
    const records = await ExportRecordRepository.list();
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/export-records/:id', async (req: Request, res: Response) => {
  try {
    const { ExportRecordRepository } = await import('../repositories/ExportRecordRepository');
    await ExportRecordRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tpl = await TemplateRepository.findById(req.params.id);
    if (!tpl) return res.status(404).json({ error: 'Not found' });
    res.json(tpl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const tpl = await TemplateRepository.create(req.body);
    res.status(201).json(tpl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tpl = await TemplateRepository.update(req.params.id, req.body);
    if (!tpl) return res.status(404).json({ error: 'Not found' });
    res.json(tpl);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await TemplateRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
