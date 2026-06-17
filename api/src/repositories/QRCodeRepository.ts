import { getDb, dbHelper, saveDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { QRCode, QRCodeStyle, PagedResponse } from '../../../shared/types';

function rowToQRCode(row: any): QRCode {
  return {
    ...row,
    style_config: typeof row.style_config === 'string' ? JSON.parse(row.style_config) : row.style_config,
  };
}

export const QRCodeRepository = {
  async list(params: {
    projectId?: string;
    status?: string;
    type?: string;
    keyword?: string;
    tag?: string;
    page: number;
    pageSize: number;
  }): Promise<PagedResponse<QRCode>> {
    const db = await getDb();
    const { projectId, status, type, keyword, tag, page, pageSize } = params;
    const where: string[] = [];
    const args: any[] = [];

    if (projectId) {
      where.push('q.project_id = ?');
      args.push(projectId);
    }
    if (status) {
      where.push('q.status = ?');
      args.push(status);
    }
    if (type) {
      where.push('q.type = ?');
      args.push(type);
    }
    if (keyword) {
      where.push('(q.name LIKE ? OR q.content LIKE ?)');
      args.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (tag) {
      where.push('q.tags LIKE ?');
      args.push(`%${tag}%`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = dbHelper.getOne(db,
      `SELECT COUNT(*) as count FROM qr_codes q ${whereSql}`,
      args
    ) as any;

    const offset = (page - 1) * pageSize;
    const rows = dbHelper.getAll(db,
      `SELECT q.*, p.name as project_name, p.color as project_color,
        (SELECT COUNT(*) FROM scan_logs s WHERE s.qrcode_id = q.id) as scan_count
       FROM qr_codes q
       LEFT JOIN projects p ON q.project_id = p.id
       ${whereSql}
       ORDER BY q.created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      args
    ) as any[];

    return {
      items: rows.map(r => ({
        ...rowToQRCode(r),
        scan_count: r.scan_count || 0,
        project: r.project_name ? { id: r.project_id, name: r.project_name, color: r.project_color, description: '', created_at: '', updated_at: '' } : undefined,
      })),
      total: totalRow?.count || 0,
      page,
      pageSize,
    };
  },

  async findById(id: string): Promise<QRCode | null> {
    const db = await getDb();
    const row = dbHelper.getOne(db,
      `SELECT q.*, p.name as project_name, p.color as project_color,
        (SELECT COUNT(*) FROM scan_logs s WHERE s.qrcode_id = q.id) as scan_count
       FROM qr_codes q LEFT JOIN projects p ON q.project_id = p.id WHERE q.id = ?`,
      [id]
    ) as any;
    if (!row) return null;
    return {
      ...rowToQRCode(row),
      scan_count: row.scan_count || 0,
      project: row.project_name ? { id: row.project_id, name: row.project_name, color: row.project_color, description: '', created_at: '', updated_at: '' } : undefined,
    };
  },

  async findByShortCode(code: string): Promise<QRCode | null> {
    const db = await getDb();
    const row = dbHelper.getOne(db, 'SELECT * FROM qr_codes WHERE short_code = ?', [code]) as any;
    if (!row) return null;
    return rowToQRCode(row);
  },

  async create(data: {
    project_id?: string;
    name: string;
    content: string;
    short_code?: string;
    target_url?: string;
    type: 'static' | 'dynamic';
    status: 'active' | 'disabled';
    style_config: QRCodeStyle;
    file_path?: string;
    tags?: string;
    expiration_date?: string;
  }): Promise<QRCode> {
    const db = await getDb();
    const id = uuidv4();
    dbHelper.run(db,
      `INSERT INTO qr_codes (id, project_id, name, content, short_code, target_url, type, status, style_config, file_path, tags, expiration_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.project_id || null,
        data.name,
        data.content,
        data.short_code || null,
        data.target_url || null,
        data.type,
        data.status,
        JSON.stringify(data.style_config),
        data.file_path || null,
        data.tags || null,
        data.expiration_date || null,
      ]
    );
    saveDb();
    return this.findById(id);
  },

  async update(id: string, data: Partial<{
    name: string;
    target_url: string;
    status: string;
    expiration_date: string;
    project_id: string;
    tags: string;
  }>): Promise<QRCode | null> {
    const db = await getDb();
    if (data.target_url !== undefined) {
      const old = await this.findById(id);
      if (old && old.target_url !== data.target_url) {
        const { UrlChangeLogRepository } = await import('./UrlChangeLogRepository');
        await UrlChangeLogRepository.create({
          qrcode_id: id,
          old_url: old.target_url || '',
          new_url: data.target_url,
        });
      }
    }
    const fields: string[] = [];
    const values: any[] = [];
    for (const key of Object.keys(data)) {
      fields.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    dbHelper.run(db, `UPDATE qr_codes SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();
    return this.findById(id);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    dbHelper.run(db, 'DELETE FROM qr_codes WHERE id = ?', [id]);
    saveDb();
  },

  async batchUpdate(ids: string[], data: Partial<{
    status: string;
    target_url: string;
    expiration_date: string;
    tags: string;
  }>): Promise<void> {
    for (const id of ids) {
      await this.update(id, data);
    }
  },

  async batchDelete(ids: string[]): Promise<void> {
    const db = await getDb();
    db.exec('BEGIN');
    try {
      for (const id of ids) dbHelper.run(db, 'DELETE FROM qr_codes WHERE id = ?', [id]);
      db.exec('COMMIT');
      saveDb();
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },

  async count(): Promise<number> {
    const db = await getDb();
    const row = dbHelper.getOne(db, 'SELECT COUNT(*) as c FROM qr_codes') as any;
    return row?.c || 0;
  },

  async activeCount(): Promise<number> {
    const db = await getDb();
    const row = dbHelper.getOne(db, 'SELECT COUNT(*) as c FROM qr_codes WHERE status = ?', ['active']) as any;
    return row?.c || 0;
  },
};
