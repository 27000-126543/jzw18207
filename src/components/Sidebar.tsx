import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  FolderKanban,
  BarChart3,
  Palette,
  Plus,
  Zap,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘', end: true },
  { path: '/generate', icon: Plus, label: '批量生成' },
  { path: '/qrcodes', icon: QrCode, label: '码库管理' },
  { path: '/projects', icon: FolderKanban, label: '项目管理' },
  { path: '/analytics', icon: BarChart3, label: '扫描统计' },
  { path: '/templates', icon: Palette, label: '模板中心' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">QR Hub</h1>
            <p className="text-xs text-gray-400">二维码管理平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-accent-400 text-white shadow-md shadow-primary-500/25'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4">
          <p className="text-xs text-gray-600 mb-2">需要帮助？</p>
          <a href="#" className="text-sm font-semibold text-primary-600 hover:underline">
            查看使用文档 →
          </a>
        </div>
      </div>
    </aside>
  );
}
