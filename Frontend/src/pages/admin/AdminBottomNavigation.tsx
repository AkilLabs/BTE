import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, Ticket, User, LogOut } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AdminBottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    document.cookie = 'jwt=; path=/; max-age=0';
    localStorage.removeItem('userEmail');
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-white/15 px-4 py-3 z-40" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <Link
          to="/admin-dashboard"
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
            isActive('/admin-dashboard')
              ? 'text-yellow-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-xs font-medium">Dashboard</span>
        </Link>

        <Link
          to="/admin-dashboard/new-movie"
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
            isActive('/admin-dashboard/new-movie')
              ? 'text-yellow-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs font-medium">New Movie</span>
        </Link>

        <Link
          to="/admin-dashboard/ticket-management"
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
            isActive('/admin-dashboard/ticket-management')
              ? 'text-yellow-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Ticket className="w-6 h-6" />
          <span className="text-xs font-medium">Tickets</span>
        </Link>

        <Link
          to="/admin-dashboard/profile"
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
            isActive('/admin-dashboard/profile')
              ? 'text-yellow-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs font-medium">Profile</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition text-white/60 hover:text-red-400"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
