import { create } from 'zustand';
import type { Project, QRCodeStyle } from '../../shared/types';

interface AppState {
  projects: Project[];
  selectedProjectId: string | null;
  qrStyle: QRCodeStyle;
  isDynamic: boolean;
  setProjects: (projects: Project[]) => void;
  setSelectedProjectId: (id: string | null) => void;
  setQrStyle: (style: Partial<QRCodeStyle>) => void;
  setIsDynamic: (v: boolean) => void;
}

const defaultStyle: QRCodeStyle = {
  color: { foreground: '#000000', background: '#ffffff' },
  shape: 'square',
  errorCorrectionLevel: 'M',
  size: 300,
};

export const useAppStore = create<AppState>((set) => ({
  projects: [],
  selectedProjectId: null,
  qrStyle: defaultStyle,
  isDynamic: true,
  setProjects: (projects) => set({ projects }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setQrStyle: (style) =>
    set((state) => ({
      qrStyle: { ...state.qrStyle, ...style, color: { ...state.qrStyle.color, ...(style.color || {}) } },
    })),
  setIsDynamic: (v) => set({ isDynamic: v }),
}));
