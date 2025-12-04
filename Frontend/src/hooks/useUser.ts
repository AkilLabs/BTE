import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  role: string;
  created_at: string | null;
  last_login: string | null;
}

interface UseUserReturn {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('https://backend.haaka.online/api/get_user_profile/', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          setUser(null);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const profile = data.profile;
        
        setUser(profile);
        // Store user name in localStorage
        if (profile.name) {
          localStorage.setItem('userName', profile.name);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userName');
    document.cookie = 'jwt=; path=/; max-age=0';
    showToast('Logged out successfully', 'success');
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}
