import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import NavLogo from '../../assets/NavLogo.svg';
import { Menu } from 'lucide-react';

export default function AdminNavbar() {
  const [open, setOpen] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);
  const toggleRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Load admin name from localStorage on mount
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setAdminName(email.split('@')[0]);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!toggleRef.current) return;
      const target = e.target as Node;
      if (!toggleRef.current.contains(target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    document.cookie = 'jwt=; path=/; max-age=0';
    localStorage.removeItem('userEmail');
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 w-full z-40 px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Glassmorphism navbar */}
        <div 
          className="rounded-full border border-white/15 px-8 py-5 flex items-center justify-center gap-16 bg-white/8 shadow-lg"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {/* Left: Logo */}
          <div className="absolute left-8 flex items-center gap-3">
            <img src={NavLogo} alt="BLACKTICKET" className="h-12 w-auto" />
          </div>

          {/* Center: Nav links */}
          <nav className="flex items-center gap-10 text-sm md:text-base text-white/80">
            <Link 
              to="/admin-dashboard" 
              className={`hover:text-white transition duration-200 font-medium relative ${
                isActive('/admin-dashboard') ? 'text-yellow-400' : ''
              }`}
            >
              Dashboard
              {isActive('/admin-dashboard') && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              )}
            </Link>
            <Link 
              to="/admin-dashboard/new-movie" 
              className={`hover:text-white transition duration-200 font-medium relative ${
                isActive('/admin-dashboard/new-movie') ? 'text-yellow-400' : ''
              }`}
            >
              New Movie
              {isActive('/admin-dashboard/new-movie') && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              )}
            </Link>
            <Link 
              to="/admin-dashboard/ticket-management" 
              className={`hover:text-white transition duration-200 font-medium relative ${
                isActive('/admin-dashboard/ticket-management') ? 'text-yellow-400' : ''
              }`}
            >
              Tickets
              {isActive('/admin-dashboard/ticket-management') && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              )}
            </Link>
          </nav>

          {/* Right: Admin profile dropdown */}
          <div className="absolute right-8 flex items-center gap-2 md:gap-3">
            {/* Dropdown Menu */}
            <div className="relative" ref={toggleRef}>
              <button
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/8 text-white hover:bg-white/12 transition duration-200"
              >
                {/* Admin Initial Avatar */}
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                  {adminName ? adminName.charAt(0).toUpperCase() : '?'}
                </div>
                {/* Admin Name */}
                {adminName && (
                  <span className="text-sm font-medium hidden sm:inline">{adminName.split(' ')[0]}</span>
                )}
              </button>

              {/* Dropdown */}
              {open && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white/5 border border-white/15 text-white shadow-xl z-20"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  {adminName && (
                    <div className="px-4 py-3 border-b border-white/15">
                      <p className="text-xs text-white/60">Logged in as</p>
                      <p className="text-sm font-semibold text-white">{adminName}</p>
                    </div>
                  )}
                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate('/admin-dashboard/profile');
                      }}
                      className="w-full text-left px-4 py-2.5 text-white hover:bg-white/10 transition duration-200 font-medium"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-white hover:bg-white/10 transition duration-200 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden inline-flex items-center justify-center p-1.5 rounded-full bg-white/8 border border-white/15 text-white hover:bg-white/12 transition duration-200">
              <Menu size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
