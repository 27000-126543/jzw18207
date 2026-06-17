import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  Edit2,
  Trash2,
  Download,
  Ban,
  Play,
  Calendar,
  Link as LinkIcon,
  CheckSquare,
  Square,
  MoreHorizontal,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import { qrcodeApi, projectApi } from '@/api';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import type { QRCode, Project } from '../../shared/types';

export default function QRCodes() {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || '';
  const [items, setItems] = useState<QRCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState(initialProjectId);
  const [selected, setSelected] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<'url' | 'extend' | null>(null);
  const [batchUrl, setBatchUrl] = useState('');
  const [batchDate, setBatchDate] = useState('');
  const { projects, setProjects } = useAppStore();

  const loadData = () => {
    qrcodeApi
      .list({ page, pageSize, keyword, status: statusFilter, type: typeFilter, projectId: projectFilter })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      });
  };

  useEffect(() => {
    loadData();
    projectApi.list().then(setProjects);
  }, [page, keyword, statusFilter, typeFilter, projectFilter, setProjects]);

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const toggleSelectAll = () => {
    if (selected.length === items.length) setSelected([]);
    else setSelected(items.map((i) => i.id));
  };

  const handleBatch = async (action: 'disable' | 'enable' | 'delete' | 'updateUrl' | 'extend') => {
    let payload: any = undefined;
    if (action === 'updateUrl') {
      if (!batchUrl) return;
      payload = { targetUrl: batchUrl };
    }
    if (action === 'extend') {
      if (!batchDate) return;
      payload = { expirationDate: batchDate };
    }
    await qrcodeApi.batch({ ids: selected, action, payload });
    setSelected([]);
    setShowBatchModal(null);
    setBatchUrl('');
    setBatchDate('');
    loadData();
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">码库管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有二维码，支持筛选、批量操作</p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-lg font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all"
        >
          <RefreshCw size={18} />
          批量生成
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-50 overflow-hidden">
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索二维码名称、URL..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
            </div>
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 appearance-none"
              >
                <option value="">全部状态</option>
                <option value="active">启用中</option>
                <option value="disabled">已禁用</option>
                <option value="expired">已过期</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            >
              <option value="">全部类型</option>
              <option value="dynamic">动态码</option>
              <option value="static">静态码</option>
            </select>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            >
              <option value="">全部项目</option>
              {projects.map((p: Project) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {selected.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
              <span className="text-sm text-primary-700 font-medium">已选择 {selected.length} 项</span>
              <button
                onClick={() => handleBatch('enable')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Play size={14} />
                批量启用
              </button>
              <button
                onClick={() => handleBatch('disable')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Ban size={14} />
                批量禁用
              </button>
              <button
                onClick={() => setShowBatchModal('url')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <LinkIcon size={14} />
                修改跳转URL
              </button>
              <button
                onClick={() => setShowBatchModal('extend')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Calendar size={14} />
                批量延期
              </button>
              <button
                onClick={() => handleBatch('delete')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 rounded-lg border border-red-100 text-red-600 hover:bg-red-100 ml-auto"
              >
                <Trash2 size={14} />
                批量删除
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="w-12 px-5 py-3 text-left">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                    {selected.length === items.length && items.length > 0 ? (
                      <CheckSquare size={18} className="text-primary-500" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">二维码</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">项目</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">扫码数</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((qr) => (
                <tr key={qr.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <button onClick={() => toggleSelect(qr.id)} className="text-gray-400 hover:text-gray-600">
                      {selected.includes(qr.id) ? (
                        <CheckSquare size={18} className="text-primary-500" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                        <img src={qrcodeApi.getImageUrl(qr.id)} alt="" className="w-10 h-10" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[240px]">{qr.name || '未命名'}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[240px]">{qr.content}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={qr.type} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={qr.status} />
                  </td>
                  <td className="px-5 py-4">
                    {qr.project ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: qr.project.color }} />
                        <span className="text-sm text-gray-700">{qr.project.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">未归类</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-gray-900">{qr.scan_count || 0}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-500">{new Date(qr.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/qrcodes/${qr.id}`}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="查看详情"
                      >
                        <Eye size={16} />
                      </Link>
                      <a
                        href={qrcodeApi.getImageUrl(qr.id)}
                        download
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="下载"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => qrcodeApi.update(qr.id, { status: qr.status === 'active' ? 'disabled' : 'active' as any }).then(loadData)}
                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title={qr.status === 'active' ? '禁用' : '启用'}
                      >
                        {qr.status === 'active' ? <Ban size={16} /> : <Play size={16} />}
                      </button>
                      <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">共 {total} 条记录</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
              {page} / {Math.ceil(total / pageSize) || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {showBatchModal === 'url' ? '批量修改跳转URL' : '批量延期'}
              </h3>
              <button onClick={() => setShowBatchModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            {showBatchModal === 'url' ? (
              <>
                <p className="text-sm text-gray-500 mb-3">为选中的 {selected.length} 个动态码设置新的跳转地址</p>
                <input
                  value={batchUrl}
                  onChange={(e) => setBatchUrl(e.target.value)}
                  placeholder="https://example.com/new-target"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">为选中的 {selected.length} 个二维码设置新的过期时间</p>
                <input
                  type="datetime-local"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBatchModal(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleBatch(showBatchModal === 'url' ? 'updateUrl' : 'extend')}
                className="px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-lg font-medium"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
