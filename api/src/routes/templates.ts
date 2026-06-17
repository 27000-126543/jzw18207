import { Router, Request, Response } from 'express';
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

router.post('/export', (_req: Request, res: Response) => {
  try {
    res.json({ success: true, message: 'Export triggered' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
