import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Upload,
  Download,
  Palette,
  Image,
  Settings2,
  ToggleLeft,
  ToggleRight,
  FolderKanban,
  FileText,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { qrcodeApi, projectApi } from '@/api';
import { useAppStore } from '@/store';
import type { QRCodeStyle } from '../../shared/types';

const shapes: Array<{ value: QRCodeStyle['shape']; label: string }> = [
  { value: 'square', label: '方形' },
  { value: 'rounded', label: '圆角' },
  { value: 'circle', label: '圆形' },
];

const eccLevels: Array<{ value: QRCodeStyle['errorCorrectionLevel']; label: string; desc: string }> = [
  { value: 'L', label: '低', desc: '7% 容错' },
  { value: 'M', label: '中', desc: '15% 容错' },
  { value: 'Q', label: '较高', desc: '25% 容错' },
  { value: 'H', label: '高', desc: '30% 容错' },
];

const presets = [
  { name: '经典黑白', fg: '#000000', bg: '#ffffff' },
  { name: '科技蓝', fg: '#1e3a8a', bg: '#ffffff' },
  { name: '翠绿生机', fg: '#059669', bg: '#ecfdf5' },
  { name: '暖橙活力', fg: '#ea580c', bg: '#fff7ed' },
  { name: '暗夜模式', fg: '#ffffff', bg: '#111827' },
  { name: '紫金尊贵', fg: '#7c3aed', bg: '#fef3c7' },
];

export default function Generate() {
  const { qrStyle, isDynamic, setQrStyle, setIsDynamic, projects, setProjects, selectedProjectId, setSelectedProjectId } = useAppStore();
  const [urlsText, setUrlsText] = useState('https://example.com/product/1\nhttps://example.com/product/2\nhttps://example.com/promo/summer');
  const [generating, setGenerating] = useState(false);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setQrStyle({ logo: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [setQrStyle]);

  const handleRemoveLogo = useCallback(() => {
    setQrStyle({ logo: undefined });
  }, [setQrStyle]);

  useEffect(() => {
    projectApi.list().then(setProjects);
  }, [setProjects]);

  const parsedUrls = useMemo(() => {
    return urlsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.includes('|')) {
          const [name, url] = line.split('|').map(s => s.trim());
          return { url, name };
        }
        return { url: line };
      });
  }, [urlsText]);

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      let startIdx = 0;
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('url') || firstLine.includes('链接') || firstLine.includes('name') || firstLine.includes('名称')) {
        startIdx = 1;
      }
      const entries: string[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2 && parts[1]) {
          entries.push(`${parts[1]}|${parts[0]}`);
        } else if (parts[0]) {
          entries.push(parts[0]);
        }
      }
      setUrlsText(entries.join('\n'));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const previewContent = isDynamic
    ? `http://localhost:5173/r/preview`
    : parsedUrls[0]?.url || 'https://example.com';

  const handleGenerate = async () => {
    if (parsedUrls.length === 0) return;
    setGenerating(true);
    setDownloadToken(null);
    try {
      const res = await qrcodeApi.batchGenerate({
        contents: parsedUrls,
        projectId: selectedProjectId || undefined,
        style: qrStyle,
        isDynamic,
        expirationDate: expirationDate || undefined,
      });
      setDownloadToken(res.downloadToken);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">批量生成二维码</h1>
        <p className="text-sm text-gray-500 mt-1">批量输入内容，自定义样式，一键生成并下载</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">批量输入内容</h3>
              <span className="ml-auto text-xs text-gray-400">{parsedUrls.length} 条内容</span>
            </div>
            <textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              placeholder="每行输入一个URL或内容，例如：&#10;https://example.com/1&#10;https://example.com/2"
              className="w-full h-44 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
            />
            <div className="flex items-center gap-3 mt-3">
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVImport} />
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                <Upload size={16} />
                导入 CSV
              </button>
              <span className="text-xs text-gray-400">支持 .txt 或 .csv 格式，每行一条链接</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <div className="flex items-center gap-2 mb-5">
              <Palette size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">样式配置</h3>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">颜色预设</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {presets.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setQrStyle({ color: { foreground: p.fg, background: p.bg } })}
                      className={`group p-3 rounded-xl border-2 transition-all ${
                        qrStyle.color.foreground === p.fg && qrStyle.color.background === p.bg
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex gap-1 mb-2 justify-center">
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: p.bg, border: '1px solid #e5e7eb' }} />
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: p.fg }} />
                      </div>
                      <p className="text-xs text-gray-600 text-center">{p.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">前景色（码点）</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrStyle.color.foreground}
                      onChange={(e) => setQrStyle({ color: { ...qrStyle.color, foreground: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={qrStyle.color.foreground}
                      onChange={(e) => setQrStyle({ color: { ...qrStyle.color, foreground: e.target.value } })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">背景色</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrStyle.color.background}
                      onChange={(e) => setQrStyle({ color: { ...qrStyle.color, background: e.target.value } })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={qrStyle.color.background}
                      onChange={(e) => setQrStyle({ color: { ...qrStyle.color, background: e.target.value } })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">码点形状</p>
                <div className="grid grid-cols-3 gap-3">
                  {shapes.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setQrStyle({ shape: s.value })}
                      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        qrStyle.shape === s.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">纠错级别</p>
                <div className="grid grid-cols-4 gap-2">
                  {eccLevels.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => setQrStyle({ errorCorrectionLevel: e.value })}
                      className={`py-2.5 px-3 rounded-xl text-sm border-2 transition-all ${
                        qrStyle.errorCorrectionLevel === e.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <p className="font-medium">{e.label}</p>
                      <p className="text-xs opacity-70">{e.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">二维码尺寸: {qrStyle.size}px</p>
                <input
                  type="range"
                  min={100}
                  max={1000}
                  step={50}
                  value={qrStyle.size}
                  onChange={(e) => setQrStyle({ size: parseInt(e.target.value) })}
                  className="w-full accent-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <div className="flex items-center gap-2 mb-5">
              <Settings2 size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">高级选项</h3>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">动态二维码</p>
                  <p className="text-xs text-gray-500 mt-0.5">扫码后跳转的目标URL可随时在后台修改，无需重新打印</p>
                </div>
                <button onClick={() => setIsDynamic(!isDynamic)} className="text-primary-500">
                  {isDynamic ? <ToggleRight size={36} /> : <ToggleLeft size={36} className="text-gray-300" />}
                </button>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FolderKanban size={16} />
                  归属项目
                </p>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value || null)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                >
                  <option value="">不归类（默认项目）</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">过期时间（可选）</p>
                <input
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Image size={16} />
                  Logo 上传
                </p>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {qrStyle.logo ? (
                  <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-100 rounded-xl">
                    <img src={qrStyle.logo} alt="Logo" className="w-10 h-10 object-contain rounded" />
                    <span className="text-sm text-primary-700 flex-1 truncate">已上传 Logo</span>
                    <button onClick={handleRemoveLogo} className="p-1 hover:bg-primary-100 rounded-lg transition-colors">
                      <X size={16} className="text-primary-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors"
                  >
                    <Upload size={18} className="text-amber-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-amber-900">点击上传 Logo</p>
                      <p className="text-xs text-amber-700">嵌入二维码中心，建议使用高纠错级别</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">实时预览</h3>
            <div
              className="rounded-2xl p-8 flex items-center justify-center mb-5"
              style={{ backgroundColor: qrStyle.color.background }}
            >
              <div className="animate-fade-in relative" style={{ borderRadius: qrStyle.shape === 'circle' ? '50%' : qrStyle.shape === 'rounded' ? '16px' : '0', overflow: 'hidden', padding: 8, backgroundColor: qrStyle.color.background }}>
                <QRCodeCanvas
                  value={previewContent}
                  size={Math.min(qrStyle.size, 240)}
                  level={qrStyle.errorCorrectionLevel}
                  fgColor={qrStyle.color.foreground}
                  bgColor={qrStyle.color.background}
                  includeMargin={false}
                />
                {qrStyle.logo && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ margin: 8 }}
                  >
                    <div className="flex items-center justify-center" style={{ width: '25%', height: '25%', backgroundColor: qrStyle.color.background, borderRadius: 4, padding: 2 }}>
                      <img src={qrStyle.logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">码类型</span>
                <span className="font-medium text-gray-900">{isDynamic ? '动态码' : '静态码'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">待生成数量</span>
                <span className="font-medium text-gray-900">{parsedUrls.length} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">尺寸</span>
                <span className="font-medium text-gray-900">{qrStyle.size} × {qrStyle.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">纠错级别</span>
                <span className="font-medium text-gray-900">{qrStyle.errorCorrectionLevel}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleGenerate}
                disabled={generating || parsedUrls.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    一键批量生成
                  </>
                )}
              </button>

              {downloadToken && (
                <a
                  href={qrcodeApi.getDownloadUrl(downloadToken)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
                >
                  <Download size={18} />
                  下载 ZIP 压缩包
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
