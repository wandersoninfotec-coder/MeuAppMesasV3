import { useAuth } from '../context/AuthContext';

// Este hook é um wrapper para facilitar o uso
export const useAuth = () => {
  const context = useAuth();
  return context;
};