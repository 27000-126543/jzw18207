export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
  qrcodeCount?: number;
  totalScans?: number;
}

export interface QRCodeStyle {
  color: {
    foreground: string;
    background: string;
  };
  logo?: string;
  shape: 'square' | 'circle' | 'rounded';
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  size: number;
}

export interface QRCode {
  id: string;
  project_id?: string;
  name: string;
  content: string;
  short_code?: string;
  target_url?: string;
  type: 'static' | 'dynamic';
  status: 'active' | 'disabled' | 'expired';
  style_config: QRCodeStyle;
  file_path?: string;
  expiration_date?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  scan_count?: number;
  project?: Project;
}

export interface ScanLog {
  id: string;
  qrcode_id: string;
  scanned_at: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  os?: string;
  browser?: string;
  country?: string;
  province?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  config: Record<string, any>;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  totalScans: number;
  todayScans: number;
  totalQRCodes: number;
  activeQRCodes: number;
  averageDaily: number;
  peakScans: number;
}

export interface TrendDataPoint {
  date: string;
  scans: number;
}

export interface GeoData {
  province: string;
  city: string;
  count: number;
}

export interface DeviceData {
  name: string;
  count: number;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UrlChangeLog {
  id: string;
  qrcode_id: string;
  old_url: string;
  new_url: string;
  created_at: string;
}

export interface ExportRecord {
  id: string;
  template_id: string;
  template_name: string;
  qrcode_count: number;
  format: 'pdf' | 'png';
  download_token: string;
  created_at: string;
}
