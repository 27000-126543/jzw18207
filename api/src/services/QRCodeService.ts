import QRCode from 'qrcode';
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

export const QRCodeService = {
  async generateQRCodeBuffer(content: string, style: QRCodeStyle): Promise<Buffer> {
    const options: any = {
      errorCorrectionLevel: style.errorCorrectionLevel || 'M',
      width: style.size || 300,
      color: {
        dark: style.color.foreground || '#000000',
        light: style.color.background || '#ffffff',
      },
      margin: 2,
    };
    const buffer = (await QRCode.toBuffer(content, options)) as unknown as Buffer;
    return buffer;
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
      const content = isDynamic ? `${process.env.BASE_URL || 'http://localhost:5173'}/r/${shortCode}` : item.url;

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
