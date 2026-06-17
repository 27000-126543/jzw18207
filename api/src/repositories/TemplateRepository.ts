import { getDb, dbHelper, saveDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { Template } from '../../../shared/types';

function rowToTemplate(row: any): Template {
  return {
    ...row,
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
  };
}

export const TemplateRepository = {
  async list(category?: string): Promise<Template[]> {
    const db = await getDb();
    let sql = 'SELECT * FROM templates';
    const args: any[] = [];
    if (category) {
      sql += ' WHERE category = ?';
      args.push(category);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = dbHelper.getAll(db, sql, args) as any[];
    return rows.map(rowToTemplate);
  },

  async findById(id: string): Promise<Template | null> {
    const db = await getDb();
    const row = dbHelper.getOne(db, 'SELECT * FROM templates WHERE id = ?', [id]) as any;
    if (!row) return null;
    return rowToTemplate(row);
  },

  async create(data: { name: string; thumbnail?: string; config: Record<string, any>; category?: string }): Promise<Template> {
    const db = await getDb();
    const id = uuidv4();
    dbHelper.run(db,
      'INSERT INTO templates (id, name, thumbnail, config, category) VALUES (?, ?, ?, ?, ?)',
      [id, data.name, data.thumbnail || null, JSON.stringify(data.config), data.category || 'general']
    );
    saveDb();
    return this.findById(id);
  },

  async update(id: string, data: Partial<{ name: string; thumbnail: string; config: Record<string, any>; category: string }>): Promise<Template | null> {
    const db = await getDb();
    const fields: string[] = [];
    const values: any[] = [];
    for (const key of Object.keys(data)) {
      if (key === 'config') {
        fields.push('config = ?');
        values.push(JSON.stringify(data.config!));
      } else {
        fields.push(`${key} = ?`);
        values.push((data as any)[key]);
      }
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    dbHelper.run(db, `UPDATE templates SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();
    return this.findById(id);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    dbHelper.run(db, 'DELETE FROM templates WHERE id = ?', [id]);
    saveDb();
  },
};
