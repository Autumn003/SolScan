import { create } from "zustand";

interface WalletState {
  favorites: string[];
  searchHistory: string[];
  isDevnet: boolean;

  addFavorite: (address: string) => void;
  removeFavorite: (address: string) => void;
  isFavorite: (address: string) => void;
  addToHistory: (address: string) => void;
  clearHistory: () => void;
  toggleNetwork: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  favorites: [],
  searchHistory: [],
  isDevnet: false,

  // Actions
  addFavorite: (address) =>
    set((state) => ({
      favorites: state.favorites.includes(address)
        ? state.favorites
        : [...state.favorites, address],
    })),

  removeFavorite: (address) =>
    set((state) => ({
      favorites: state.favorites.filter((fav) => fav !== address),
    })),

  isFavorite: (address) => get().favorites.includes(address),

  addToHistory: (address) =>
    set((state) => ({
      searchHistory: [
        address,
        ...state.searchHistory.filter((addr) => addr !== address),
      ].slice(0, 20), // Keep only the latest 20 entries
    })),

  clearHistory: () => set({ searchHistory: [] }),

  toggleNetwork: () => set((state) => ({ isDevnet: !state.isDevnet })),
}));
