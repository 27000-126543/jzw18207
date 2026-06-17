import QRCode from 'qrcode';
import { createCanvas, loadImage, SKRSContext2D } from '@napi-rs/canvas';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeRepository } from '../repositories/QRCodeRepository';
import type { QRCodeStyle, QRCode as QRCodeType } from '../../../shared/types';

const qrDir = path.resolve(process.cwd(), 'qr-codes');
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

function generateShortCode(): string {
  return Math.random().toString(36).substring(2, 10);
}

function applyRoundedMask(ctx: SKRSContext2D, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();
}

function applyCircleMask(ctx: SKRSContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
}

export const QRCodeService = {
  async generateQRCodeBuffer(content: string, style: QRCodeStyle): Promise<Buffer> {
    const size = style.size || 300;
    const margin = Math.round(size * 0.06);
    const canvasSize = size + margin * 2;

    const qrDataUrl: string = await QRCode.toDataURL(content, {
      errorCorrectionLevel: style.errorCorrectionLevel || 'M',
      width: size,
      margin: 0,
      color: {
        dark: style.color.foreground || '#000000',
        light: style.color.background || '#ffffff',
      },
    });

    const qrImage = await loadImage(qrDataUrl);

    const mainCanvas = createCanvas(canvasSize, canvasSize);
    const ctx = mainCanvas.getContext('2d');

    ctx.save();
    if (style.shape === 'circle') {
      applyCircleMask(ctx, canvasSize / 2, canvasSize / 2, canvasSize / 2);
    } else if (style.shape === 'rounded') {
      const r = canvasSize * 0.08;
      applyRoundedMask(ctx, canvasSize, canvasSize, r);
    }

    ctx.fillStyle = style.color.background || '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.drawImage(qrImage, margin, margin, size, size);

    if (style.logo) {
      const logoSize = Math.round(size * 0.25);
      const logoX = Math.round((canvasSize - logoSize) / 2);
      const logoY = Math.round((canvasSize - logoSize) / 2);
      const padding = Math.round(logoSize * 0.15);
      const cornerRadius = Math.round(padding * 0.5);

      ctx.fillStyle = style.color.background || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(logoX - padding + cornerRadius, logoY - padding);
      ctx.lineTo(logoX + logoSize + padding - cornerRadius, logoY - padding);
      ctx.quadraticCurveTo(logoX + logoSize + padding, logoY - padding, logoX + logoSize + padding, logoY - padding + cornerRadius);
      ctx.lineTo(logoX + logoSize + padding, logoY + logoSize + padding - cornerRadius);
      ctx.quadraticCurveTo(logoX + logoSize + padding, logoY + logoSize + padding, logoX + logoSize + padding - cornerRadius, logoY + logoSize + padding);
      ctx.lineTo(logoX - padding + cornerRadius, logoY + logoSize + padding);
      ctx.quadraticCurveTo(logoX - padding, logoY + logoSize + padding, logoX - padding, logoY + logoSize + padding - cornerRadius);
      ctx.lineTo(logoX - padding, logoY - padding + cornerRadius);
      ctx.quadraticCurveTo(logoX - padding, logoY - padding, logoX - padding + cornerRadius, logoY - padding);
      ctx.closePath();
      ctx.fill();

      let logoSrc = style.logo;
      if (!logoSrc.startsWith('data:')) {
        logoSrc = `data:image/png;base64,${logoSrc}`;
      }
      const logoImage = await loadImage(logoSrc);
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    }

    ctx.restore();

    return mainCanvas.toBuffer('image/png');
  },

  async batchGenerate(params: {
    contents: Array<{ url: string; name?: string }>;
    projectId?: string;
    style: QRCodeStyle;
    isDynamic: boolean;
    expirationDate?: string;
  }): Promise<{ ids: string[]; downloadToken: string }> {
    const { contents, projectId, style, isDynamic, expirationDate } = params;
    const ids: string[] = [];
    const zip = new JSZip();

    for (let i = 0; i < contents.length; i++) {
      const item = contents[i];
      const shortCode = isDynamic ? generateShortCode() : undefined;
      const content = isDynamic ? `${process.env.BASE_URL || 'http://localhost:3001'}/r/${shortCode}` : item.url;

      const qr = await QRCodeRepository.create({
        project_id: projectId,
        name: item.name || `二维码 ${i + 1}`,
        content,
        short_code: shortCode,
        target_url: isDynamic ? item.url : undefined,
        type: isDynamic ? 'dynamic' : 'static',
        status: 'active',
        style_config: style,
        expiration_date: expirationDate,
      });
      ids.push(qr.id);

      const buffer = await this.generateQRCodeBuffer(content, style);
      const fileName = `${qr.name || qr.id}.png`;
      zip.file(fileName.replace(/[\\/:*?"<>|]/g, '_'), buffer);

      const filePath = path.join(qrDir, `${qr.id}.png`);
      fs.writeFileSync(filePath, buffer);
    }

    const zipToken = uuidv4();
    const zipPath = path.join(qrDir, `${zipToken}.zip`);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(zipPath, zipBuffer);

    return { ids, downloadToken: zipToken };
  },

  async getDownloadPath(token: string): Promise<string | null> {
    const filePath = path.join(qrDir, `${token}.zip`);
    if (fs.existsSync(filePath)) return filePath;
    return null;
  },

  async getQRCodeImagePath(id: string): Promise<string | null> {
    const filePath = path.join(qrDir, `${id}.png`);
    if (fs.existsSync(filePath)) return filePath;
    const qr = await QRCodeRepository.findById(id);
    if (!qr) return null;
    const buffer = await this.generateQRCodeBuffer(qr.content, qr.style_config);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  },

  async regenerateQRCode(id: string, style?: QRCodeStyle): Promise<QRCodeType | null> {
    const qr = await QRCodeRepository.findById(id);
    if (!qr) return null;
    const finalStyle = style || qr.style_config;
    const buffer = await this.generateQRCodeBuffer(qr.content, finalStyle);
    const filePath = path.join(qrDir, `${id}.png`);
    fs.writeFileSync(filePath, buffer);
    return QRCodeRepository.update(id, {});
  },
};
