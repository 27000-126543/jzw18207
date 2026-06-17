import { getDb, dbHelper, saveDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { UrlChangeLog } from '../../../shared/types';

export const UrlChangeLogRepository = {
  async create(data: { qrcode_id: string; old_url: string; new_url: string }): Promise<UrlChangeLog> {
    const db = await getDb();
    const id = uuidv4();
    dbHelper.run(db,
      'INSERT INTO url_change_logs (id, qrcode_id, old_url, new_url) VALUES (?, ?, ?, ?)',
      [id, data.qrcode_id, data.old_url, data.new_url]
    );
    saveDb();
    return dbHelper.getOne(db, 'SELECT * FROM url_change_logs WHERE id = ?', [id]) as UrlChangeLog;
  },

  async findByQRCodeId(qrcodeId: string): Promise<UrlChangeLog[]> {
    const db = await getDb();
    return dbHelper.getAll(db,
      'SELECT * FROM url_change_logs WHERE qrcode_id = ? ORDER BY created_at DESC',
      [qrcodeId]
    ) as UrlChangeLog[];
  },
};
