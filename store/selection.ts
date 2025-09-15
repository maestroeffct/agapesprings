// store/selection.ts
import { create } from "zustand";

type SelState = {
  selectedCategory?: any;
  setSelectedCategory: (c: any) => void;
  clear: () => void;
};

export const useSelection = create<SelState>((set) => ({
  selectedCategory: undefined,
  setSelectedCategory: (c) => set({ selectedCategory: c }),
  clear: () => set({ selectedCategory: undefined }),
}));
