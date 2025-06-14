import { useAuthContext } from '@/context/AuthContext';

export const useAuth = () => {
  const { devotee, isAuthenticated, authInProgress, systemRole, login, logout } = useAuthContext();
  return { devotee, isAuthenticated, authInProgress, systemRole, login, logout };
};