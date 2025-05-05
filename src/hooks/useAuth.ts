import { useAuthContext } from '@/context/AuthContext';

export const useAuth = () => {
  const { devotee, isAuthenticated, systemRole, login, logout } = useAuthContext();
  return { devotee, isAuthenticated, systemRole, login, logout };
};