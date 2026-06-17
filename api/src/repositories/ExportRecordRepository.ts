import { getDb, dbHelper, saveDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { ExportRecord } from '../../../shared/types';

export const ExportRecordRepository = {
  async create(data: {
    template_id: string;
    template_name: string;
    qrcode_count: number;
    format: 'pdf' | 'png';
    download_token: string;
  }): Promise<ExportRecord> {
    const db = await getDb();
    const id = uuidv4();
    dbHelper.run(db,
      'INSERT INTO export_records (id, template_id, template_name, qrcode_count, format, download_token) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.template_id, data.template_name, data.qrcode_count, data.format, data.download_token]
    );
    saveDb();
    return dbHelper.getOne(db, 'SELECT * FROM export_records WHERE id = ?', [id]) as ExportRecord;
  },

  async list(): Promise<ExportRecord[]> {
    const db = await getDb();
    return dbHelper.getAll(db, 'SELECT * FROM export_records ORDER BY created_at DESC') as ExportRecord[];
  },

  async findById(id: string): Promise<ExportRecord | null> {
    const db = await getDb();
    return dbHelper.getOne(db, 'SELECT * FROM export_records WHERE id = ?', [id]) as ExportRecord | null;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    dbHelper.run(db, 'DELETE FROM export_records WHERE id = ?', [id]);
    saveDb();
  },
};
