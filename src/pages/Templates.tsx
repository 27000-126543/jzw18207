import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Palette,
  FileImage,
  Edit2,
  Trash2,
  Download,
  LayoutGrid,
  Utensils,
  Building2,
  Briefcase,
  Tag,
  MoreHorizontal,
  X,
  FileText,
  Image,
  Check,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { templateApi, projectApi, qrcodeApi } from '@/api';
import type { Template, Project, QRCode } from '../../shared/types';

const categories = [
  { key: 'all', label: '全部模板', icon: LayoutGrid },
  { key: 'restaurant', label: '餐饮行业', icon: Utensils },
  { key: 'exhibition', label: '展会活动', icon: Building2 },
  { key: 'business', label: '商务名片', icon: Briefcase },
  { key: 'product', label: '产品标签', icon: Tag },
];

const mockTemplates = [
  {
    id: 't1', name: '餐厅桌贴-A4', category: 'restaurant',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    title: '扫码点餐', subtitle: 'Scan to Order',
  },
  {
    id: 't2', name: '展会海报-竖版', category: 'exhibition',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    title: '扫一扫了解更多', subtitle: 'Scan for Details',
  },
  {
    id: 't3', name: '商务名片-标准', category: 'business',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    title: '扫码保存名片', subtitle: 'Digital Business Card',
  },
  {
    id: 't4', name: '产品标签贴纸', category: 'product',
    gradient: 'from-orange-400 via-amber-500 to-yellow-500',
    title: '扫码溯源', subtitle: 'Product Authenticity',
  },
  {
    id: 't5', name: '婚礼请柬-二维码', category: 'general',
    gradient: 'from-pink-400 via-rose-500 to-red-400',
    title: '诚挚邀请', subtitle: 'You are Invited',
  },
  {
    id: 't6', name: '景区导览码', category: 'general',
    gradient: 'from-green-500 via-emerald-600 to-teal-600',
    title: '语音导览', subtitle: 'Audio Guide',
  },
  {
    id: 't7', name: 'WiFi分享贴纸', category: 'general',
    gradient: 'from-blue-400 via-indigo-500 to-purple-500',
    title: '免费WiFi', subtitle: 'Free Internet',
  },
  {
    id: 't8', name: '调查问卷海报', category: 'general',
    gradient: 'from-rose-500 via-pink-500 to-purple-500',
    title: '参与问卷', subtitle: 'Take a Survey',
  },
];

interface ExportModalProps {
  template: { id: string; name: string } | null;
  onClose: () => void;
}

function ExportModal({ template, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'png'>('pdf');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [qrcodes, setQrcodes] = useState<QRCode[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadToken, setDownloadToken] = useState('');

  useEffect(() => {
    projectApi.list().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setQrcodes([]);
      setSelectedIds(new Set());
      return;
    }
    setLoading(true);
    qrcodeApi
      .list({ projectId: selectedProject, pageSize: 200 })
      .then((res) => {
        setQrcodes(res.items);
        setSelectedIds(new Set());
      })
      .catch(() => setQrcodes([]))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === qrcodes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(qrcodes.map((q) => q.id)));
    }
  }, [selectedIds.size, qrcodes]);

  const handleExport = async () => {
    if (!template || selectedIds.size === 0) return;
    setExporting(true);
    try {
      const result = await templateApi.exportWithQR({
        templateId: template.id,
        qrcodeIds: Array.from(selectedIds),
        format,
      });
      setDownloadToken(result.downloadToken);
    } catch {
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  if (!template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">批量套码导出</h3>
            <p className="text-sm text-gray-500 mt-0.5">模板：{template.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {downloadToken ? (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={32} className="text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">导出成功！</p>
              <a
                href={templateApi.getDownloadUrl(downloadToken)}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Download size={18} />
                下载文件
              </a>
              <button
                onClick={() => {
                  setDownloadToken('');
                  setSelectedIds(new Set());
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                继续导出
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat('pdf')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                      format === 'pdf'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FileText size={20} />
                    <div className="text-left">
                      <div className="font-medium">PDF</div>
                      <div className="text-xs opacity-70">印刷级文件</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormat('png')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                      format === 'png'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Image size={20} />
                    <div className="text-left">
                      <div className="font-medium">PNG 图片包</div>
                      <div className="text-xs opacity-70">ZIP 压缩包</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择项目</label>
                <div className="relative">
                  <FolderOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none bg-white"
                  >
                    <option value="">请选择项目</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedProject && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      选择二维码
                      {qrcodes.length > 0 && (
                        <span className="ml-1 text-gray-400">({selectedIds.size}/{qrcodes.length})</span>
                      )}
                    </label>
                    {qrcodes.length > 0 && (
                      <button
                        onClick={toggleAll}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {selectedIds.size === qrcodes.length ? '取消全选' : '全选'}
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <Loader2 size={20} className="animate-spin mr-2" />
                      加载中...
                    </div>
                  ) : qrcodes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      该项目下暂无二维码
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {qrcodes.map((qr) => (
                        <label
                          key={qr.id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedIds.has(qr.id) ? 'bg-primary-50/50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(qr.id)}
                            onChange={() => toggleSelect(qr.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500/20"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {qr.name || qr.id}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {qr.content || qr.target_url}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              qr.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {qr.status === 'active' ? '启用' : '停用'}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!downloadToken && (
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={handleExport}
              disabled={selectedIds.size === 0 || exporting}
              className={`w-full py-3 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 ${
                selectedIds.size === 0 || exporting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-accent-400 shadow-lg shadow-primary-500/25 hover:shadow-xl'
              }`}
            >
              {exporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download size={18} />
                  导出（已选 {selectedIds.size} 个）
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [exportTarget, setExportTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    templateApi.list().then(setTemplates);
  }, []);

  const displayed = mockTemplates.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory,
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模板中心</h1>
          <p className="text-sm text-gray-500 mt-1">
            选择模板批量套入二维码，快速导出印刷文件
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-lg font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all">
          <Plus size={18} />
          新建模板
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === c.key
                ? 'bg-gradient-to-r from-primary-500 to-accent-400 text-white shadow-md shadow-primary-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            <c.icon size={16} />
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayed.map((t, i) => (
          <div
            key={t.id}
            className="group bg-white rounded-2xl shadow-soft border border-gray-50 overflow-hidden hover:shadow-hover transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient}`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                  <div className="w-24 h-24 bg-white/95 rounded-xl flex items-center justify-center p-2 shadow-xl mb-4">
                    <div
                      className="w-full h-full bg-gray-900 rounded-md"
                      style={{
                        backgroundImage: `conic-gradient(#111 25%, #fff 0 50%, #111 0 75%, #fff 0)`,
                        backgroundSize: '8px 8px',
                      }}
                    />
                  </div>
                  <p className="text-xl font-bold text-center drop-shadow-lg">{t.title}</p>
                  <p className="text-sm opacity-80 mt-1">{t.subtitle}</p>
                </div>
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <button className="p-2.5 bg-white rounded-xl shadow-lg hover:scale-105 transition-transform text-gray-700">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setExportTarget({ id: t.id, name: t.name })}
                    className="p-2.5 bg-white rounded-xl shadow-lg hover:scale-105 transition-transform text-gray-700"
                  >
                    <Download size={18} />
                  </button>
                  <button className="p-2.5 bg-white rounded-xl shadow-lg hover:scale-105 transition-transform text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{t.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {categories.find((c) => c.key === t.category)?.label || '通用模板'}
                  </p>
                </div>
                <button
                  onClick={() => setExportTarget({ id: t.id, name: t.name })}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-2xl p-8 border border-primary-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center text-white shadow-xl">
              <Palette size={26} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">需要自定义设计模板？</h3>
              <p className="text-sm text-gray-600 mt-1 max-w-md">
                使用在线模板编辑器，拖拽式操作，将二维码嵌入到您的设计中，支持批量导出印刷级
                PDF。
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              <FileImage size={18} />
              批量套码
            </Link>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl">
              <Plus size={18} />
              创建自定义模板
            </button>
          </div>
        </div>
      </div>

      <ExportModal template={exportTarget} onClose={() => setExportTarget(null)} />
    </div>
  );
}
