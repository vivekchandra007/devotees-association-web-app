import { useAuthContext } from '@/context/AuthContext';

export const useAuth = () => {
  const { devotee, isAuthenticated, login, logout } = useAuthContext();
  return { devotee, isAuthenticated, login, logout };
};