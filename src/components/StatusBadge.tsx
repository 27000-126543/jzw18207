import { Check, X, Clock } from 'lucide-react';

interface Props {
  status: 'active' | 'disabled' | 'expired' | 'dynamic' | 'static';
  size?: 'sm' | 'md';
}

const configs: Record<string, { label: string; bg: string; color: string; icon?: any }> = {
  active: { label: '启用中', bg: 'bg-green-50', color: 'text-green-700', icon: Check },
  disabled: { label: '已禁用', bg: 'bg-gray-100', color: 'text-gray-600', icon: X },
  expired: { label: '已过期', bg: 'bg-red-50', color: 'text-red-700', icon: Clock },
  dynamic: { label: '动态码', bg: 'bg-blue-50', color: 'text-blue-700' },
  static: { label: '静态码', bg: 'bg-slate-100', color: 'text-slate-700' },
};

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const cfg = configs[status] || configs.active;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 ${cfg.bg} ${cfg.color} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      } rounded-full font-medium`}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {cfg.label}
    </span>
  );
}
