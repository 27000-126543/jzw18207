import { getDb, dbHelper, saveDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../../../shared/types';

export const ProjectRepository = {
  async list(): Promise<Project[]> {
    const db = await getDb();
    const rows = dbHelper.getAll(db,
      `SELECT p.*,
        (SELECT COUNT(*) FROM qr_codes q WHERE q.project_id = p.id) as qrcodeCount,
        (SELECT COUNT(*) FROM scan_logs s JOIN qr_codes q ON s.qrcode_id = q.id WHERE q.project_id = p.id) as totalScans
       FROM projects p ORDER BY p.created_at DESC`
    ) as any[];
    return rows as Project[];
  },

  async findById(id: string): Promise<Project | null> {
    const db = await getDb();
    const row = dbHelper.getOne(db,
      `SELECT p.*,
        (SELECT COUNT(*) FROM qr_codes q WHERE q.project_id = p.id) as qrcodeCount,
        (SELECT COUNT(*) FROM scan_logs s JOIN qr_codes q ON s.qrcode_id = q.id WHERE q.project_id = p.id) as totalScans
       FROM projects p WHERE p.id = ?`,
      [id]
    ) as any;
    return row || null;
  },

  async create(data: { name: string; description?: string; color?: string }): Promise<Project> {
    const db = await getDb();
    const id = uuidv4();
    dbHelper.run(db,
      'INSERT INTO projects (id, name, description, color) VALUES (?, ?, ?, ?)',
      [id, data.name, data.description || '', data.color || '#3b82f6']
    );
    saveDb();
    return this.findById(id);
  },

  async update(id: string, data: Partial<{ name: string; description: string; color: string }>): Promise<Project | null> {
    const db = await getDb();
    const fields: string[] = [];
    const values: any[] = [];
    for (const key of Object.keys(data)) {
      fields.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    dbHelper.run(db, `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();
    return this.findById(id);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    dbHelper.run(db, 'DELETE FROM projects WHERE id = ?', [id]);
    saveDb();
  },
};
