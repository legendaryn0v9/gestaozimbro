import { useAuth } from '../lib/auth';

export function useUserSector() {
  const { user } = useAuth();
  return user?.sector || null;
}
