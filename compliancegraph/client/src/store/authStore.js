import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  company: null,
  loading: true,
  setUser: (user) => set({ user }),
  setCompany: (company) => set({ company }),
  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
