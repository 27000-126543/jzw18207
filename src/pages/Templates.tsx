import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { templateApi } from '@/api';
import type { Template } from '../../shared/types';

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
    title: '扫码点餐',
    subtitle: 'Scan to Order',
  },
  {
    id: 't2', name: '展会海报-竖版', category: 'exhibition',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    title: '扫一扫了解更多',
    subtitle: 'Scan for Details',
  },
  {
    id: 't3', name: '商务名片-标准', category: 'business',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    title: '扫码保存名片',
    subtitle: 'Digital Business Card',
  },
  {
    id: 't4', name: '产品标签贴纸', category: 'product',
    gradient: 'from-orange-400 via-amber-500 to-yellow-500',
    title: '扫码溯源',
    subtitle: 'Product Authenticity',
  },
  {
    id: 't5', name: '婚礼请柬-二维码', category: 'general',
    gradient: 'from-pink-400 via-rose-500 to-red-400',
    title: '诚挚邀请',
    subtitle: 'You are Invited',
  },
  {
    id: 't6', name: '景区导览码', category: 'general',
    gradient: 'from-green-500 via-emerald-600 to-teal-600',
    title: '语音导览',
    subtitle: 'Audio Guide',
  },
  {
    id: 't7', name: 'WiFi分享贴纸', category: 'general',
    gradient: 'from-blue-400 via-indigo-500 to-purple-500',
    title: '免费WiFi',
    subtitle: 'Free Internet',
  },
  {
    id: 't8', name: '调查问卷海报', category: 'general',
    gradient: 'from-rose-500 via-pink-500 to-purple-500',
    title: '参与问卷',
    subtitle: 'Take a Survey',
  },
];

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    templateApi.list().then(setTemplates);
  }, []);

  const displayed = mockTemplates.filter(
    (t) => activeCategory === 'all' || t.category === activeCategory
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模板中心</h1>
          <p className="text-sm text-gray-500 mt-1">选择模板批量套入二维码，快速导出印刷文件</p>
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
                    <div className="w-full h-full bg-gray-900 rounded-md" style={{
                      backgroundImage: `conic-gradient(#111 25%, #fff 0 50%, #111 0 75%, #fff 0)`,
                      backgroundSize: '8px 8px',
                    }} />
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
                  <button className="p-2.5 bg-white rounded-xl shadow-lg hover:scale-105 transition-transform text-gray-700">
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
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
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
                使用在线模板编辑器，拖拽式操作，将二维码嵌入到您的设计中，支持批量导出印刷级 PDF。
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
    </div>
  );
}
