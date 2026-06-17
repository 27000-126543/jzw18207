import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { qrcodeApi, analyticsApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { QRCode, ScanLog, UrlChangeLog, TrendDataPoint, GeoData, DeviceData } from '../../shared/types';
import {
  ArrowLeft,
  Edit2,
  ExternalLink,
  Copy,
  Clock,
  MapPin,
  Monitor,
  History,
  Tag,
  X,
  Check,
  Smartphone,
  Globe,
  QrCode,
} from 'lucide-react';

const PIE_COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16', '#6366f1'];

const TAG_COLORS = [
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-violet-50 text-violet-700',
  'bg-amber-50 text-amber-700',
  'bg-rose-50 text-rose-700',
  'bg-cyan-50 text-cyan-700',
];

export default function QRCodeDetail() {
  const { id } = useParams<{ id: string }>();
  const [qr, setQr] = useState<QRCode | null>(null);
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [changeLogs, setChangeLogs] = useState<UrlChangeLog[]>([]);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [geo, setGeo] = useState<GeoData[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [browsers, setBrowsers] = useState<DeviceData[]>([]);
  const [editUrl, setEditUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const load = async () => {
      try {
        const [qrData, scansData, logsData, trendData, geoData, devData, browserData] = await Promise.all([
          qrcodeApi.get(id),
          qrcodeApi.getScans(id),
          qrcodeApi.getChangeLogs(id),
          analyticsApi.trend({ qrcodeId: id, period: 'week' }),
          analyticsApi.geo({ qrcodeId: id }),
          analyticsApi.devices({ qrcodeId: id, field: 'device_type' }),
          analyticsApi.devices({ qrcodeId: id, field: 'browser' }),
        ]);
        setQr(qrData);
        setScans(scansData);
        setChangeLogs(logsData);
        setTrend(trendData);
        setGeo(geoData);
        setDevices(devData);
        setBrowsers(browserData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUpdateUrl = async () => {
    if (!id || !editUrl) return;
    await qrcodeApi.update(id, { target_url: editUrl });
    const updated = await qrcodeApi.get(id);
    setQr(updated);
    const logs = await qrcodeApi.getChangeLogs(id);
    setChangeLogs(logs);
    setEditing(false);
    setEditUrl('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <QrCode size={48} className="mb-4" />
        <p className="text-lg font-medium">二维码不存在</p>
        <Link to="/qrcodes" className="mt-4 text-sm text-primary-500 hover:underline">返回码库</Link>
      </div>
    );
  }

  const tags = qr.tags ? qr.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const geoTotal = geo.reduce((s, g) => s + g.count, 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/qrcodes"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{qr.name || '未命名'}</h1>
              <StatusBadge status={qr.type} size="md" />
              <StatusBadge status={qr.status} size="md" />
            </div>
            <p className="text-sm text-gray-500 mt-1">创建于 {new Date(qr.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Layout: Left 60% + Right 40% */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Info Section */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">基本信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">类型</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={qr.type} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">内容</span>
                <p className="text-sm text-gray-900 font-mono break-all">{qr.content}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">短码</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 font-mono">{qr.short_code || '-'}</span>
                  {qr.short_code && (
                    <button
                      onClick={() => handleCopy(qr.short_code!)}
                      className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">项目</span>
                <div className="flex items-center gap-2">
                  {qr.project ? (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: qr.project.color }} />
                      <span className="text-sm text-gray-900">{qr.project.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">未归类</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">过期时间</span>
                <p className="text-sm text-gray-900">
                  {qr.expiration_date ? new Date(qr.expiration_date).toLocaleString() : '永不过期'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">更新时间</span>
                <p className="text-sm text-gray-900">{new Date(qr.updated_at).toLocaleString()}</p>
              </div>
              {tags.length > 0 && (
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={12} /> 标签
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, i) => (
                      <span key={i} className={`px-2.5 py-1 text-xs rounded-full font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scan Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <div className="flex items-center gap-2 mb-5">
              <Clock size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">扫码趋势</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <defs>
                    <linearGradient id="detailBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="scans" name="扫码次数" fill="url(#detailBarGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geo Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <div className="flex items-center gap-2 mb-5">
              <MapPin size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">地域分布</h3>
            </div>
            {geo.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">暂无地域数据</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">排名</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">省份</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">城市</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">扫码次数</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geo.slice(0, 10).map((g, i) => {
                      const pct = geoTotal > 0 ? ((g.count / geoTotal) * 100).toFixed(1) : '0';
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                              i < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-sm text-gray-900 font-medium">{g.province}</td>
                          <td className="py-2.5 px-3 text-sm text-gray-600">{g.city}</td>
                          <td className="py-2.5 px-3 text-sm font-semibold text-gray-900">{g.count.toLocaleString()}</td>
                          <td className="py-2.5 px-3 w-1/3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary-500 to-accent-400 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Device Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone size={16} className="text-primary-600" />
                <h3 className="font-semibold text-gray-900 text-sm">设备类型</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={devices} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                      {devices.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-primary-600" />
                <h3 className="font-semibold text-gray-900 text-sm">浏览器分布</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={browsers} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                      {browsers.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* QR Code Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">二维码预览</h3>
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                <img src={qrcodeApi.getImageUrl(qr.id)} alt="QR Code" className="w-44 h-44" />
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <a
                href={qrcodeApi.getImageUrl(qr.id)}
                download
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-lg font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all"
              >
                <ExternalLink size={14} />
                下载二维码
              </a>
            </div>
          </div>

          {/* Target URL Section */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">跳转地址</h3>
              {qr.type === 'dynamic' && !editing && (
                <button
                  onClick={() => { setEditing(true); setEditUrl(qr.target_url || ''); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setEditing(false); setEditUrl(''); }}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    <X size={14} className="inline mr-1" />取消
                  </button>
                  <button
                    onClick={handleUpdateUrl}
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-lg font-medium"
                  >
                    <Check size={14} className="inline mr-1" />保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm text-gray-900 font-mono break-all flex-1">
                    {qr.target_url || qr.content}
                  </span>
                  <button
                    onClick={() => handleCopy(qr.target_url || qr.content)}
                    className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors flex-shrink-0"
                    title="复制链接"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600">已复制到剪贴板</p>
                )}
                {qr.type === 'dynamic' && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Edit2 size={10} /> 动态码可随时修改跳转地址
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recent Scans */}
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Monitor size={18} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">最近扫码记录</h3>
            </div>
            {scans.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">暂无扫码记录</p>
            ) : (
              <div className="space-y-0 divide-y divide-gray-50">
                {scans.slice(0, 20).map((s) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{s.device_type || '未知'}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{s.browser || '未知'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{s.city || s.ip_address || '-'}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(s.scanned_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* URL Change History */}
          {qr.type === 'dynamic' && (
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <History size={18} className="text-primary-600" />
                <h3 className="font-semibold text-gray-900">URL 变更历史</h3>
              </div>
              {changeLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">暂无变更记录</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100" />
                  <div className="space-y-4">
                    {changeLogs.map((log) => (
                      <div key={log.id} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 border-2 border-white shadow-sm" />
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                          <div className="text-sm">
                            <span className="text-red-400 font-mono break-all line-through opacity-60">{log.old_url}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-300">→</span>
                            <span className="text-sm text-emerald-600 font-mono break-all">{log.new_url}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
