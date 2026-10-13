import { create } from 'zustand';

export type UserRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'STUDENT' | 'TEACHER' | 'PARENT';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  customRole?: any; // To store populated custom role object
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    document.cookie = 'token=' + token + '; path=/; max-age=86400; SameSite=Lax';
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    document.cookie = 'token=; Max-Age=0; path=/;';
    // Call API to logout and clear cookie if needed
    set({ user: null, token: null });
  }
}));
