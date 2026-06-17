import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  QrCode,
  BarChart3,
  Edit2,
  Trash2,
  MoreHorizontal,
  FolderKanban,
  X,
  Palette,
} from 'lucide-react';
import { projectApi } from '@/api';
import { useAppStore } from '@/store';
import type { Project } from '../../shared/types';

const colors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function Projects() {
  const { projects, setProjects } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(colors[0]);

  const loadData = () => projectApi.list().then(setProjects);
  useEffect(() => { loadData(); }, [setProjects]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setColor(colors[0]);
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description);
    setColor(p.color);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (editing) {
      await projectApi.update(editing.id, { name, description, color });
    } else {
      await projectApi.create({ name, description, color });
    }
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该项目吗？')) return;
    await projectApi.remove(id);
    loadData();
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
          <p className="text-sm text-gray-500 mt-1">按项目分类管理您的二维码资产</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-lg font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all"
        >
          <Plus size={18} />
          新建项目
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-soft border border-gray-50">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <FolderKanban size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有项目</h3>
          <p className="text-sm text-gray-500 mb-5">创建项目来更好地分类管理您的二维码</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} />
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 hover:shadow-hover transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: p.color, boxShadow: `0 8px 20px ${p.color}33` }}
                  >
                    <FolderKanban size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-400">创建于 {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              {p.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>
              )}

              <div className="flex items-center gap-6 mb-5 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-gray-400" />
                  <span className="text-sm">
                    <span className="font-semibold text-gray-900">{p.qrcodeCount || 0}</span>
                    <span className="text-gray-500"> 个码</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-gray-400" />
                  <span className="text-sm">
                    <span className="font-semibold text-gray-900">{p.totalScans || 0}</span>
                    <span className="text-gray-500"> 次扫码</span>
                  </span>
                </div>
              </div>

              <Link
                to={`/qrcodes?projectId=${p.id}`}
                className="block text-center py-2.5 bg-gray-50 hover:bg-primary-50 text-gray-700 hover:text-primary-700 rounded-xl text-sm font-medium transition-colors"
              >
                查看项目码库 →
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? '编辑项目' : '新建项目'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">项目名称</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入项目名称"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">项目描述（可选）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简单描述这个项目的用途"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-1.5">
                  <Palette size={14} />
                  主题颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {editing ? '保存修改' : '创建项目'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
