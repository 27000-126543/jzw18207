import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'qrplatform.db');

export function getDb(): Promise<Database> {
  if (db) return Promise.resolve(db);
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const wasmPath = path.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        if (file === 'sql-wasm.wasm' && fs.existsSync(wasmPath)) return wasmPath;
        return path.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
      },
    });

    let data: Uint8Array | undefined;
    if (fs.existsSync(dbPath)) {
      data = new Uint8Array(fs.readFileSync(dbPath));
    }

    db = new SQL.Database(data);
    return db;
  })();

  return dbPromise;
}

export function saveDb(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('Save DB failed:', e);
  }
}

setInterval(saveDb, 5000);
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(0); });

function runStmt(stmt: any, params: any[] = []) {
  stmt.bind(params);
  while (stmt.step()) {}
  stmt.reset();
}

function getOne(db: Database, sql: string, params: any[] = []): any | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result: any | null = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function getAll(db: Database, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(db: Database, sql: string, params: any[] = []): void {
  const stmt = db.prepare(sql);
  runStmt(stmt, params);
}

export const dbHelper = {
  getOne,
  getAll,
  run,
  exec: (db: Database, sql: string) => db.exec(sql),
};

export async function initDB() {
  const db = await getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#3b82f6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS qr_codes (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      name TEXT DEFAULT '',
      content TEXT NOT NULL,
      short_code TEXT UNIQUE,
      target_url TEXT,
      type TEXT NOT NULL DEFAULT 'static',
      status TEXT NOT NULL DEFAULT 'active',
      style_config TEXT NOT NULL DEFAULT '{}',
      file_path TEXT,
      tags TEXT DEFAULT '',
      expiration_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_qr_codes_project ON qr_codes(project_id);
    CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON qr_codes(status);
    CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON qr_codes(short_code);

    CREATE TABLE IF NOT EXISTS url_change_logs (
      id TEXT PRIMARY KEY,
      qrcode_id TEXT NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
      old_url TEXT NOT NULL DEFAULT '',
      new_url TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_url_change_logs_qrcode ON url_change_logs(qrcode_id);

    CREATE TABLE IF NOT EXISTS export_records (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      template_name TEXT NOT NULL DEFAULT '',
      qrcode_count INTEGER NOT NULL DEFAULT 0,
      format TEXT NOT NULL DEFAULT 'pdf',
      download_token TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_export_records_template ON export_records(template_id);

    CREATE TABLE IF NOT EXISTS scan_logs (
      id TEXT PRIMARY KEY,
      qrcode_id TEXT NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      device_type TEXT,
      os TEXT,
      browser TEXT,
      country TEXT,
      province TEXT,
      city TEXT,
      latitude REAL,
      longitude REAL
    );

    CREATE INDEX IF NOT EXISTS idx_scan_logs_qrcode ON scan_logs(qrcode_id);
    CREATE INDEX IF NOT EXISTS idx_scan_logs_time ON scan_logs(scanned_at);

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      thumbnail TEXT,
      config TEXT NOT NULL DEFAULT '{}',
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  saveDb();
  await seedData();
}

async function seedData() {
  const db = await getDb();
  const projectCount = getOne(db, 'SELECT COUNT(*) as count FROM projects') as any;
  if (projectCount && projectCount.count > 0) return;

  const projects = [
    { id: 'p1', name: '2024春季展会', description: '上海国际展览会二维码项目', color: '#3b82f6' },
    { id: 'p2', name: '餐厅菜单项目', description: '连锁餐厅扫码点餐', color: '#10b981' },
    { id: 'p3', name: '名片二维码', description: '销售团队电子名片', color: '#f59e0b' },
  ];

  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];
  const provinces = ['北京', '上海', '广东', '广东', '浙江', '四川', '湖北', '陕西'];
  const devices = ['Mobile', 'Desktop', 'Tablet'];
  const osList = ['iOS', 'Android', 'Windows', 'macOS'];
  const browsers = ['Chrome', 'Safari', 'WeChat', 'Edge', 'Firefox'];

  const qrList: any[] = [];
  for (let i = 1; i <= 8; i++) {
    qrList.push({
      id: `qr${i}`,
      projectId: projects[(i - 1) % 3].id,
      name: `二维码 ${i}`,
      content: `https://example.com/landing/${i}`,
      shortCode: `code${i}`,
      targetUrl: `https://example.com/landing/${i}`,
      type: i <= 5 ? 'dynamic' : 'static',
      status: i === 7 ? 'disabled' : 'active',
      style: JSON.stringify({
        color: { foreground: '#000000', background: '#ffffff' },
        shape: i % 3 === 0 ? 'rounded' : 'square',
        errorCorrectionLevel: 'M',
        size: 300,
      }),
    });
  }

  db.exec('BEGIN');
  try {
    const insertProject = db.prepare('INSERT INTO projects (id, name, description, color) VALUES (?, ?, ?, ?)');
    for (const p of projects) runStmt(insertProject, [p.id, p.name, p.description, p.color]);
    insertProject.free();

    const insertQR = db.prepare(
      'INSERT INTO qr_codes (id, project_id, name, content, short_code, target_url, type, status, style_config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const q of qrList) {
      runStmt(insertQR, [q.id, q.projectId, q.name, q.content, q.shortCode, q.targetUrl, q.type, q.status, q.style]);
    }
    insertQR.free();

    const insertScan = db.prepare(
      'INSERT INTO scan_logs (id, qrcode_id, scanned_at, ip_address, device_type, os, browser, province, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    let scanId = 1;
    const now = Date.now();
    for (let day = 0; day < 30; day++) {
      const scansPerDay = Math.floor(Math.random() * 40) + 10;
      for (let s = 0; s < scansPerDay; s++) {
        const qrIdx = Math.floor(Math.random() * qrList.length);
        const cityIdx = Math.floor(Math.random() * cities.length);
        const date = new Date(now - day * 24 * 3600 * 1000 - Math.random() * 24 * 3600 * 1000);
        runStmt(insertScan, [
          `scan${scanId++}`,
          qrList[qrIdx].id,
          date.toISOString(),
          `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          devices[Math.floor(Math.random() * devices.length)],
          osList[Math.floor(Math.random() * osList.length)],
          browsers[Math.floor(Math.random() * browsers.length)],
          provinces[cityIdx],
          cities[cityIdx],
        ]);
      }
    }
    insertScan.free();

    const insertTemplate = db.prepare('INSERT INTO templates (id, name, category, config) VALUES (?, ?, ?, ?)');
    runStmt(insertTemplate, ['t1', '餐厅桌贴-A4', 'restaurant', JSON.stringify({ width: 210, height: 297, elements: [] })]);
    runStmt(insertTemplate, ['t2', '展会海报-竖版', 'exhibition', JSON.stringify({ width: 420, height: 594, elements: [] })]);
    runStmt(insertTemplate, ['t3', '商务名片-标准', 'business', JSON.stringify({ width: 90, height: 54, elements: [] })]);
    runStmt(insertTemplate, ['t4', '产品标签贴纸', 'product', JSON.stringify({ width: 60, height: 40, elements: [] })]);
    insertTemplate.free();

    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    console.error('Seed failed:', e);
    throw e;
  }
  saveDb();
}
