import { create } from 'zustand';

interface UIState {
  isModalOpen: boolean;
  modalType: string | null;
  modalProps: unknown | null;
  openModal: (type: string, props?: unknown) => void;
  closeModal: () => void;
}

/**
 * 전역 UI 상태 스토어 (모달 등)
 */
export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  modalType: null,
  modalProps: null,
  openModal: (type, props) => set({ isModalOpen: true, modalType: type, modalProps: props }),
  closeModal: () => set({ isModalOpen: false, modalType: null, modalProps: null }),
}));
