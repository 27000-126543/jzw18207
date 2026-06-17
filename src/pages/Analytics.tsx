import { useState, useEffect } from 'react';
import {
  BarChart3,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { analyticsApi, projectApi } from '@/api';
import { useAppStore } from '@/store';
import type { AnalyticsSummary, TrendDataPoint, GeoData, DeviceData } from '../../shared/types';

const PIE_COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16', '#6366f1'];

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [geo, setGeo] = useState<GeoData[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [os, setOs] = useState<DeviceData[]>([]);
  const [browsers, setBrowsers] = useState<DeviceData[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [projectId, setProjectId] = useState('');
  const { projects, setProjects } = useAppStore();

  useEffect(() => {
    projectApi.list().then(setProjects);
  }, [setProjects]);

  useEffect(() => {
    analyticsApi.summary({ projectId: projectId || undefined }).then(setSummary);
    analyticsApi.trend({ projectId: projectId || undefined, period }).then(setTrend);
    analyticsApi.geo({ projectId: projectId || undefined }).then(setGeo);
    analyticsApi.devices({ projectId: projectId || undefined, field: 'device_type' }).then(setDevices);
    analyticsApi.devices({ projectId: projectId || undefined, field: 'os' }).then(setOs);
    analyticsApi.devices({ projectId: projectId || undefined, field: 'browser' }).then(setBrowsers);
  }, [period, projectId]);

  const statCards = [
    { label: '累计扫码', value: summary?.totalScans || 0, icon: BarChart3, color: 'from-blue-500 to-cyan-400' },
    { label: '今日扫码', value: summary?.todayScans || 0, icon: Calendar, color: 'from-emerald-500 to-teal-400' },
    { label: '日均扫码', value: summary?.averageDaily || 0, icon: TrendingUp, color: 'from-violet-500 to-purple-400' },
    { label: '活跃二维码', value: summary?.activeQRCodes || 0, icon: Monitor, color: 'from-amber-500 to-orange-400' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">扫描统计</h1>
          <p className="text-sm text-gray-500 mt-1">多维度分析扫码数据，洞察用户行为</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">全部项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === 'day' ? '近7天' : p === 'week' ? '近30天' : '近90天'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                <s.icon size={20} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">扫描趋势</h3>
            <p className="text-xs text-gray-500 mt-0.5">扫码数量随时间的变化情况</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="scans" name="扫码次数" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <Smartphone size={18} className="text-primary-600" />
            <h3 className="font-semibold text-gray-900">设备类型</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {devices.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <Globe size={18} className="text-primary-600" />
            <h3 className="font-semibold text-gray-900">操作系统</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={os}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {os.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <Monitor size={18} className="text-primary-600" />
            <h3 className="font-semibold text-gray-900">浏览器分布</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={browsers}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {browsers.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-50">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={18} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">地域分布 Top 15</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">排名</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">省份</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">城市</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">扫码次数</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">占比</th>
              </tr>
            </thead>
            <tbody>
              {geo.slice(0, 15).map((g, i) => {
                const total = geo.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? ((g.count / total) * 100).toFixed(1) : '0';
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        i < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{g.province}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{g.city}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">{g.count.toLocaleString()}</td>
                    <td className="py-3 px-4 w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-accent-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
