import { Router, Request, Response } from 'express';
import { ProjectRepository } from '../repositories/ProjectRepository';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json(await ProjectRepository.list());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await ProjectRepository.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const project = await ProjectRepository.create(req.body);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const project = await ProjectRepository.update(req.params.id, req.body);
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await ProjectRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
