import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { QRCodeRepository } from '../repositories/QRCodeRepository';

const outputDir = path.resolve(process.cwd(), 'qr-codes');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

interface TemplateConfig {
  width: number;
  height: number;
  title: string;
  subtitle: string;
  qrSize: number;
  qrX: number;
  qrY: number;
  titleY: number;
  titleSize: number;
  bgGradient: [string, string];
}

const templateConfigs: Record<string, TemplateConfig> = {
  t1: {
    width: 210, height: 297, title: '扫码点餐', subtitle: 'Scan to Order',
    qrSize: 80, qrX: 65, qrY: 100, titleY: 230, titleSize: 36,
    bgGradient: ['#0d9488', '#06b6d4'],
  },
  t2: {
    width: 210, height: 297, title: '扫码了解更多', subtitle: 'Scan for Details',
    qrSize: 70, qrX: 70, qrY: 80, titleY: 240, titleSize: 32,
    bgGradient: ['#7c3aed', '#d946ef'],
  },
  t3: {
    width: 90, height: 54, title: '扫码保存名片', subtitle: '',
    qrSize: 35, qrX: 5, qrY: 10, titleY: 35, titleSize: 12,
    bgGradient: ['#334155', '#1e293b'],
  },
  t4: {
    width: 60, height: 40, title: '扫码溯源', subtitle: '',
    qrSize: 25, qrX: 17.5, qrY: 8, titleY: 30, titleSize: 10,
    bgGradient: ['#f97316', '#eab308'],
  },
};

function mmToPt(mm: number): number {
  return mm * 2.835;
}

const MM_TO_PX = 3.78;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function drawTemplateCanvas(
  config: TemplateConfig,
  qrBuffer: Buffer,
  qrName: string,
): Promise<Buffer> {
  const canvasWidth = mmToPx(config.width);
  const canvasHeight = mmToPx(config.height);
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, hexToRgba(config.bgGradient[0]));
  gradient.addColorStop(1, hexToRgba(config.bgGradient[1]));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const titleX = mmToPx(config.qrX);
  const titleY = mmToPx(config.titleY);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${config.titleSize}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(config.title, titleX, titleY);

  if (config.subtitle) {
    const subtitleSize = config.titleSize * 0.5;
    const subtitleY = titleY + config.titleSize + 4;
    ctx.fillStyle = 'rgba(230, 230, 230, 0.9)';
    ctx.font = `${subtitleSize}px sans-serif`;
    ctx.fillText(config.subtitle, titleX, subtitleY);
  }

  const qrImage = await loadImage(qrBuffer);
  const qrX = mmToPx(config.qrX);
  const qrY = mmToPx(config.qrY);
  const qrSize = mmToPx(config.qrSize);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  if (qrName) {
    const nameY = mmToPx(config.qrY - 8);
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px sans-serif';
    ctx.fillText(qrName, qrX, nameY);
  }

  return canvas.toBuffer('image/png');
}

export const TemplateExportService = {
  async exportWithQRCodes(
    templateId: string,
    qrcodeIds: string[],
    format: 'pdf' | 'png',
  ): Promise<string> {
    const config = templateConfigs[templateId];
    if (!config) throw new Error('Template not found');

    const qrcodes = [];
    for (const id of qrcodeIds) {
      const qr = await QRCodeRepository.findById(id);
      if (qr) qrcodes.push(qr);
    }
    if (qrcodes.length === 0) throw new Error('No QR codes found');

    let token: string;
    if (format === 'pdf') {
      token = await this.exportPDF(config, qrcodes);
    } else {
      token = await this.exportImages(templateId, config, qrcodes);
    }

    const { ExportRecordRepository } = await import('../repositories/ExportRecordRepository');
    const { TemplateRepository } = await import('../repositories/TemplateRepository');
    const tpl = await TemplateRepository.findById(templateId);
    const templateName = tpl?.name || templateId;
    await ExportRecordRepository.create({
      template_id: templateId,
      template_name: templateName,
      qrcode_count: qrcodes.length,
      format,
      download_token: token,
    });

    return token;
  },

  async exportPDF(config: TemplateConfig, qrcodes: any[]): Promise<string> {
    const pdfDoc = await PDFDocument.create();

    for (const qr of qrcodes) {
      const qrContent = qr.content || qr.target_url || '';
      const qrBuffer = await QRCode.toBuffer(qrContent, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });
      const qrName = qr.name || '';
      const templateImageBuffer = await drawTemplateCanvas(config, qrBuffer, qrName);

      const pngImage = await pdfDoc.embedPng(templateImageBuffer);
      const pageWidth = mmToPt(config.width);
      const pageHeight = mmToPt(config.height);

      const imgAspect = config.width / config.height;
      let drawWidth = pageWidth;
      let drawHeight = pageWidth / imgAspect;
      if (drawHeight > pageHeight) {
        drawHeight = pageHeight;
        drawWidth = pageHeight * imgAspect;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const token = uuidv4();
    const outPath = path.join(outputDir, `${token}.pdf`);
    fs.writeFileSync(outPath, Buffer.from(pdfBytes));
    return token;
  },

  async exportImages(
    templateId: string,
    config: TemplateConfig,
    qrcodes: any[],
  ): Promise<string> {
    const zip = new JSZip();

    for (const qr of qrcodes) {
      const qrContent = qr.content || qr.target_url || '';
      const qrBuffer = await QRCode.toBuffer(qrContent, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });
      const qrName = qr.name || qr.id || '';
      const templateBuffer = await drawTemplateCanvas(config, qrBuffer, qrName);
      const cleanTemplateId = templateId.replace(/[\\/:*?"<>|]/g, '_');
      const cleanQrName = qrName.replace(/[\\/:*?"<>|]/g, '_');
      const fileName = `${cleanTemplateId}_${cleanQrName}.png`;
      zip.file(fileName, templateBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const token = uuidv4();
    const outPath = path.join(outputDir, `${token}.zip`);
    fs.writeFileSync(outPath, zipBuffer);
    return token;
  },
};
