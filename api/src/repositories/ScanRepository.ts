import { getDb, dbHelper, saveDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { ScanLog, TrendDataPoint, GeoData, DeviceData, AnalyticsSummary } from '../../../shared/types';

export const ScanRepository = {
  async create(data: {
    qrcode_id: string;
    ip_address?: string;
    user_agent?: string;
    device_type?: string;
    os?: string;
    browser?: string;
    province?: string;
    city?: string;
  }): Promise<ScanLog> {
    const db = await getDb();
    const id = uuidv4();
    dbHelper.run(db,
      `INSERT INTO scan_logs (id, qrcode_id, ip_address, user_agent, device_type, os, browser, province, city)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.qrcode_id,
        data.ip_address || null,
        data.user_agent || null,
        data.device_type || null,
        data.os || null,
        data.browser || null,
        data.province || null,
        data.city || null,
      ]
    );
    saveDb();
    return dbHelper.getOne(db, 'SELECT * FROM scan_logs WHERE id = ?', [id]) as ScanLog;
  },

  async getSummary(params: { qrcodeId?: string; projectId?: string; startDate?: string; endDate?: string }): Promise<AnalyticsSummary> {
    const db = await getDb();
    const { qrcodeId, projectId, startDate, endDate } = params;
    const where: string[] = [];
    const args: any[] = [];
    const where2: string[] = [];
    const args2: any[] = [];

    if (qrcodeId) {
      where.push('s.qrcode_id = ?');
      args.push(qrcodeId);
    }
    if (projectId) {
      where.push('q.project_id = ?');
      args.push(projectId);
      where2.push('project_id = ?');
      args2.push(projectId);
    }
    if (startDate) {
      where.push('s.scanned_at >= ?');
      args.push(startDate);
    }
    if (endDate) {
      where.push('s.scanned_at <= ?');
      args.push(endDate);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const whereSql2 = where2.length > 0 ? `WHERE ${where2.join(' AND ')}` : '';

    const totalRow = dbHelper.getOne(db,
      `SELECT COUNT(*) as c FROM scan_logs s LEFT JOIN qr_codes q ON s.qrcode_id = q.id ${whereSql}`,
      args
    ) as any;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayArgs = [...args, todayStart.toISOString()];
    const todayRow = dbHelper.getOne(db,
      `SELECT COUNT(*) as c FROM scan_logs s LEFT JOIN qr_codes q ON s.qrcode_id = q.id ${whereSql ? whereSql + ' AND ' : 'WHERE '} s.scanned_at >= ?`,
      todayArgs
    ) as any;

    const qrCount = dbHelper.getOne(db, `SELECT COUNT(*) as c FROM qr_codes ${whereSql2}`, args2) as any;
    const qrActive = dbHelper.getOne(db,
      `SELECT COUNT(*) as c FROM qr_codes ${whereSql2 ? whereSql2 + ' AND ' : 'WHERE '} status = 'active'`,
      args2
    ) as any;

    const dateRange = dbHelper.getOne(db,
      `SELECT MIN(scanned_at) as minDate, MAX(scanned_at) as maxDate FROM scan_logs s LEFT JOIN qr_codes q ON s.qrcode_id = q.id ${whereSql}`,
      args
    ) as any;

    let days = 1;
    if (dateRange && dateRange.minDate && dateRange.maxDate) {
      days = Math.max(1, Math.ceil((new Date(dateRange.maxDate).getTime() - new Date(dateRange.minDate).getTime()) / (24 * 3600 * 1000)));
    }

    return {
      totalScans: totalRow?.c || 0,
      todayScans: todayRow?.c || 0,
      totalQRCodes: qrCount?.c || 0,
      activeQRCodes: qrActive?.c || 0,
      averageDaily: Math.round((totalRow?.c || 0) / days),
      peakScans: 0,
    };
  },

  async getTrend(params: { qrcodeId?: string; projectId?: string; period: 'day' | 'week' | 'month' }): Promise<TrendDataPoint[]> {
    const db = await getDb();
    const { qrcodeId, projectId, period } = params;
    const days = period === 'day' ? 7 : period === 'week' ? 30 : 90;
    const where: string[] = [];
    const args: any[] = [];

    if (qrcodeId) {
      where.push('qrcode_id = ?');
      args.push(qrcodeId);
    }
    if (projectId) {
      where.push('q.id IN (SELECT id FROM qr_codes WHERE project_id = ?)');
      args.push(projectId);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const now = Date.now();
    const result: TrendDataPoint[] = [];

    const rows = dbHelper.getAll(db,
      `SELECT DATE(s.scanned_at) as date, COUNT(*) as scans
       FROM scan_logs s
       LEFT JOIN qr_codes q ON s.qrcode_id = q.id
       ${whereSql}
       GROUP BY DATE(s.scanned_at)
       ORDER BY date DESC
       LIMIT ${days}`,
      args
    ) as any[];

    const map = new Map(rows.map(r => [r.date, r.scans]));

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 3600 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      result.push({ date: dateStr, scans: map.get(dateStr) || 0 });
    }

    return result;
  },

  async getGeo(params: { qrcodeId?: string; projectId?: string }): Promise<GeoData[]> {
    const db = await getDb();
    const { qrcodeId, projectId } = params;
    const where: string[] = [];
    const args: any[] = [];

    if (qrcodeId) {
      where.push('s.qrcode_id = ?');
      args.push(qrcodeId);
    }
    if (projectId) {
      where.push('q.project_id = ?');
      args.push(projectId);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const rows = dbHelper.getAll(db,
      `SELECT COALESCE(s.province, '未知') as province, COALESCE(s.city, '未知') as city, COUNT(*) as count
       FROM scan_logs s LEFT JOIN qr_codes q ON s.qrcode_id = q.id
       ${whereSql}
       GROUP BY s.province, s.city
       ORDER BY count DESC
       LIMIT 50`,
      args
    ) as any[];

    return rows;
  },

  async getByDeviceField(params: { qrcodeId?: string; projectId?: string; field: 'device_type' | 'os' | 'browser' }): Promise<DeviceData[]> {
    const db = await getDb();
    const { qrcodeId, projectId, field } = params;
    const where: string[] = [];
    const args: any[] = [];

    if (qrcodeId) {
      where.push('s.qrcode_id = ?');
      args.push(qrcodeId);
    }
    if (projectId) {
      where.push('q.project_id = ?');
      args.push(projectId);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const rows = dbHelper.getAll(db,
      `SELECT COALESCE(s.${field}, '未知') as name, COUNT(*) as count
       FROM scan_logs s LEFT JOIN qr_codes q ON s.qrcode_id = q.id
       ${whereSql}
       GROUP BY s.${field}
       ORDER BY count DESC`,
      args
    ) as any[];

    return rows;
  },

  async listByQRCode(qrcodeId: string, limit = 100): Promise<ScanLog[]> {
    const db = await getDb();
    return dbHelper.getAll(db,
      'SELECT * FROM scan_logs WHERE qrcode_id = ? ORDER BY scanned_at DESC LIMIT ?',
      [qrcodeId, limit]
    ) as ScanLog[];
  },
};
