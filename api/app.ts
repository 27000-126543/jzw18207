import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDB } from './src/db';
import { QRCodeRepository } from './src/repositories/QRCodeRepository';
import { ScanRepository } from './src/repositories/ScanRepository';
import { parseUserAgent, getClientIp } from './src/utils/ua-parser';
import { parseIPLocation } from './src/utils/ip-location';

import qrcodeRoutes from './src/routes/qrcodes';
import projectRoutes from './src/routes/projects';
import analyticsRoutes from './src/routes/analytics';
import templateRoutes from './src/routes/templates';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const qrDir = path.resolve(process.cwd(), 'qr-codes');
app.use('/qr-codes', express.static(qrDir));

app.get('/r/:code', async (req, res) => {
  try {
    const qr = await QRCodeRepository.findByShortCode(req.params.code);
    if (!qr) {
      return res.status(404).send('二维码不存在或已失效');
    }
    if (qr.status !== 'active') {
      return res.status(403).send('该二维码已被禁用或已过期');
    }

    const ua = parseUserAgent(req.headers['user-agent'] || '');
    const ip = getClientIp(req);
    const location = parseIPLocation(ip);
    await ScanRepository.create({
      qrcode_id: qr.id,
      ip_address: ip,
      user_agent: req.headers['user-agent'],
      device_type: ua.device_type,
      os: ua.os,
      browser: ua.browser,
      province: location.province,
      city: location.city,
    });

    const targetUrl = qr.target_url || qr.content;
    if (targetUrl.startsWith('http')) {
      res.redirect(302, targetUrl);
    } else {
      res.send(targetUrl);
    }
  } catch (err: any) {
    res.status(500).send('服务器错误: ' + err.message);
  }
});

app.use('/api/qrcodes', qrcodeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initDB().then(() => {
  console.log('✅ Database initialized');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
});

export default app;
