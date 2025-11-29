// Using JSX transform; no need to import React directly
import { Home, Film, Info, User } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function BottomNavigation() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const toggleRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Load user name from localStorage on mount
  useEffect(() => {
    const name = localStorage.getItem('userName');
    setUserName(name);
  }, []);

  const handleClickOutside = (e: React.MouseEvent) => {
    if (toggleRef.current && !toggleRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/user-home';
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-slate-800 z-40">
        <div className="flex items-center justify-around px-4 py-3">
          {/* Home */}
          <a
            href="/"
            className={`flex flex-col items-center gap-1 transition duration-200 relative ${
              isActive('/')
                ? 'text-yellow-400'
                : 'text-white hover:text-yellow-400'
            }`}
          >
            <Home size={24} />
            {isActive('/') && (
              <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            )}
            <span className="text-xs font-medium">Home</span>
          </a>

          {/* Movies */}
          <a
            href="/movies"
            className={`flex flex-col items-center gap-1 transition duration-200 relative ${
              isActive('/movies')
                ? 'text-yellow-400'
                : 'text-white hover:text-yellow-400'
            }`}
          >
            <Film size={24} />
            {isActive('/movies') && (
              <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            )}
            <span className="text-xs font-medium">Movies</span>
          </a>

          {/* About Us */}
          <a
            href="#"
            className="flex flex-col items-center gap-1 text-white hover:text-yellow-400 transition duration-200"
          >
            <Info size={24} />
            <span className="text-xs font-medium">About Us</span>
          </a>

          {/* Profile Dropdown */}
          <div className="relative" ref={toggleRef}>
            <button
              onClick={() => setOpen((s) => !s)}
              className="flex flex-col items-center gap-1 text-white hover:text-yellow-400 transition duration-200"
            >
              <User size={24} />
              <span className="text-xs font-medium">Profile</span>
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div
                className="absolute bottom-full right-0 mb-2 w-40 rounded-2xl bg-black border border-slate-700 shadow-lg z-50"
                onClick={handleClickOutside}
              >
                <ul className="py-2 text-xs">
                  {userName ? (
                    <>
                      <li className="px-4 py-2 border-b border-slate-700">
                        <p className="text-white/60 text-xs">Logged in as</p>
                        <p className="text-white font-semibold">{userName}</p>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigate('/profile');
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-slate-800 transition duration-200 font-medium"
                        >
                          Profile
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            document.cookie = 'jwt=; path=/; max-age=0';
                            localStorage.clear();
                            setUserName(null);
                            showToast('Logged out successfully', 'success');
                            navigate('/login');
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-slate-800 transition duration-200 font-medium"
                        >
                          Logout
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate('/login');
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-slate-800 transition duration-200 font-medium"
                      >
                        Login
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Add padding to body to account for bottom nav on mobile */}
      <div className="md:hidden h-20" />
    </>
  );
}
