import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
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

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
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

    if (format === 'pdf') {
      return this.exportPDF(config, qrcodes);
    } else {
      return this.exportImages(config, qrcodes);
    }
  },

  async exportPDF(config: TemplateConfig, qrcodes: any[]): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const qr of qrcodes) {
      const page = pdfDoc.addPage([mmToPt(config.width), mmToPt(config.height)]);
      const { width, height } = page.getSize();
      const [bgR, bgG, bgB] = hexToRgb(config.bgGradient[0]);

      page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(bgR, bgG, bgB) });

      const qrContent = qr.content || qr.target_url || '';
      const qrBuffer = await QRCode.toBuffer(qrContent, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });
      const qrImage = await pdfDoc.embedPng(qrBuffer);
      const qrPtSize = mmToPt(config.qrSize);
      page.drawImage(qrImage, {
        x: mmToPt(config.qrX),
        y: mmToPt(config.qrY),
        width: qrPtSize,
        height: qrPtSize,
      });

      page.drawText(config.title, {
        x: mmToPt(config.qrX),
        y: mmToPt(config.titleY),
        size: config.titleSize,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      if (config.subtitle) {
        page.drawText(config.subtitle, {
          x: mmToPt(config.qrX),
          y: mmToPt(config.titleY) - config.titleSize - 4,
          size: config.titleSize * 0.5,
          font,
          color: rgb(0.9, 0.9, 0.9),
        });
      }

      const qrName = qr.name || '';
      if (qrName) {
        page.drawText(qrName, {
          x: mmToPt(config.qrX),
          y: mmToPt(config.qrY) - 16,
          size: 9,
          font,
          color: rgb(0.9, 0.9, 0.9),
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const token = uuidv4();
    const outPath = path.join(outputDir, `${token}.pdf`);
    fs.writeFileSync(outPath, Buffer.from(pdfBytes));
    return token;
  },

  async exportImages(config: TemplateConfig, qrcodes: any[]): Promise<string> {
    const zip = new JSZip();

    for (const qr of qrcodes) {
      const qrContent = qr.content || qr.target_url || '';
      const qrBuffer = await QRCode.toBuffer(qrContent, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });
      const fileName = `${(qr.name || qr.id).replace(/[\\/:*?"<>|]/g, '_')}.png`;
      zip.file(fileName, qrBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const token = uuidv4();
    const outPath = path.join(outputDir, `${token}.zip`);
    fs.writeFileSync(outPath, zipBuffer);
    return token;
  },
};
