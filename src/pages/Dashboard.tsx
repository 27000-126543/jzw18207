import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  BarChart3,
  Eye,
  Zap,
  Plus,
  FolderKanban,
  Palette,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi, qrcodeApi, projectApi } from '@/api';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import type { AnalyticsSummary, TrendDataPoint, QRCode, Project } from '../../shared/types';

export default function Dashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [recent, setRecent] = useState<QRCode[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const setStoreProjects = useAppStore((s) => s.setProjects);

  useEffect(() => {
    analyticsApi.summary().then(setSummary);
    analyticsApi.trend({ period: 'week' }).then(setTrend);
    qrcodeApi.list({ pageSize: 5 }).then((r) => setRecent(r.items));
    projectApi.list().then((data) => {
      setProjects(data);
      setStoreProjects(data);
    });
  }, [setStoreProjects]);

  const stats = [
    { label: '二维码总数', value: summary?.totalQRCodes || 0, icon: QrCode, gradient: 'from-blue-500 to-cyan-400' },
    { label: '今日扫码量', value: summary?.todayScans || 0, icon: Eye, gradient: 'from-amber-500 to-orange-400' },
    { label: '活跃二维码', value: summary?.activeQRCodes || 0, icon: Zap, gradient: 'from-emerald-500 to-teal-400' },
    { label: '累计扫码', value: summary?.totalScans || 0, icon: BarChart3, gradient: 'from-violet-500 to-purple-400' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，这是您的二维码运营数据概览</p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-lg font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus size={18} />
          批量生成二维码
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 hover:shadow-hover transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-lg`}
              >
                <s.icon size={20} />
              </div>
              <div className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={12} />
                +12%
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">扫描趋势</h3>
              <p className="text-xs text-gray-500 mt-0.5">近 30 天扫码数据变化</p>
            </div>
            <Link to="/analytics" className="text-sm text-primary-600 font-medium hover:underline inline-flex items-center gap-1">
              查看详情 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fill="url(#colorScans)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">快捷操作</h3>
          </div>
          <div className="space-y-3">
            {[
              { to: '/generate', icon: Plus, label: '批量生成二维码', desc: '快速创建一批二维码', color: 'text-blue-600 bg-blue-50' },
              { to: '/projects', icon: FolderKanban, label: '管理项目', desc: '按项目分类管理码库', color: 'text-emerald-600 bg-emerald-50' },
              { to: '/analytics', icon: BarChart3, label: '查看统计', desc: '扫描数据趋势与分析', color: 'text-violet-600 bg-violet-50' },
              { to: '/templates', icon: Palette, label: '模板中心', desc: '设计印刷物料模板', color: 'text-amber-600 bg-amber-50' },
            ].map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg ${it.color} flex items-center justify-center`}>
                  <it.icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{it.label}</p>
                  <p className="text-xs text-gray-500">{it.desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">最近生成</h3>
            <Link to="/qrcodes" className="text-sm text-primary-600 font-medium hover:underline">
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {recent.map((qr) => (
              <div key={qr.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                  <img
                    src={qrcodeApi.getImageUrl(qr.id)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{qr.name}</p>
                  <p className="text-xs text-gray-500 truncate">{qr.content}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={qr.status} />
                  <span className="text-xs text-gray-400">{qr.scan_count || 0} 次扫码</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900">项目列表</h3>
            <Link to="/projects" className="text-sm text-primary-600 font-medium hover:underline">
              管理项目
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{p.qrcodeCount || 0} 个码</span>
                  <span>{p.totalScans || 0} 次扫码</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
