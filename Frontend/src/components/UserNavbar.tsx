// UserNavbar.tsx
// Using JSX transform; no need to import React directly
import { Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import NavLogo from '../assets/NavLogo.svg';

export default function UserNavbar() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const toggleRef = useRef<HTMLDivElement | null>(null); // original container ref
  const buttonRef = useRef<HTMLButtonElement | null>(null); // for position calc
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Portal coords
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Load user name from localStorage on mount
  useEffect(() => {
    const name = localStorage.getItem('userName');
    setUserName(name);
  }, []);

  // Close dropdown on outside click (works for portal because we check both button & dropdown)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      // if click inside toggleRef (original group) ignore
      if (toggleRef.current && toggleRef.current.contains(target)) {
        return;
      }
      // if portal dropdown contains it, ignore
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('click', onDocClick);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => {
      if (open) computeCoords();
    });
    return () => {
      window.removeEventListener('click', onDocClick);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', () => {});
    };
  }, [open]);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/user-home';
    }
    return location.pathname === path;
  };

  // compute coords for portal dropdown (align to right edge like original absolute right-0)
  const computeCoords = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 256; // w-64 in px
    // align dropdown right edge with button right edge (similar to absolute right-0 inside parent)
    const left = Math.max(8, rect.right - width);
    const top = rect.bottom + 10; // gap
    setCoords({ left, top });
  };

  useEffect(() => {
    if (open) {
      // compute after paint to ensure rect accurate
      setTimeout(() => computeCoords(), 0);
    } else {
      setCoords(null);
    }
  }, [open]);

  // Mock: show toast helper (you already have showToast)
  const localShow = (msg: string, type: 'success' | 'error' = 'success') => {
    try {
      showToast(msg, type);
    } catch {
      console.log(msg);
    }
  };

  const onLogout = () => {
    setOpen(false);
    try {
      document.cookie = 'jwt=; path=/; max-age=0';
    } catch {}
    localStorage.clear();
    setUserName(null);
    localShow('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <>
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
              <a
                href="/"
                className={`hover:text-white transition duration-200 font-medium relative ${
                  isActive('/') ? 'text-yellow-400' : ''
                }`}
              >
                Home
                {isActive('/') && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                )}
              </a>
              <a
                href="/movies"
                className={`hover:text-white transition duration-200 font-medium relative ${
                  isActive('/movies') ? 'text-yellow-400' : ''
                }`}
              >
                Movies
                {isActive('/movies') && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                )}
              </a>
              <a
                href="/about-us"
                className={`hover:text-white transition duration-200 font-medium relative ${
                  isActive('/about-us') ? 'text-yellow-400' : ''
                }`}
              >
                About Us
                {isActive('/about-us') && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                )}
              </a>
            </nav>

            {/* Right: User profile dropdown */}
            <div
              className="absolute right-8 flex items-center gap-2 md:gap-3 bg-white/8"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              {/* Dropdown Menu container - keep original ref for click containment */}
              <div
                className="relative bg-white/8 rounded-full"
                ref={toggleRef}
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <button
                  ref={buttonRef}
                  aria-haspopup="true"
                  aria-expanded={open}
                  onClick={() => setOpen((s) => !s)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/8 text-white hover:bg-white/12 transition duration-200"
                >
                  {/* User Initial Avatar */}
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                    {userName ? userName.charAt(0).toUpperCase() : '?'}
                  </div>
                  {/* User Name */}
                  {userName && <span className="text-sm font-medium hidden sm:inline">{userName.split(' ')[0]}</span>}
                </button>

                {/* Mobile menu button kept (unchanged position) */}
                <button className="md:hidden inline-flex items-center justify-center p-1.5 rounded-full bg-white/8 border border-white/15 text-white hover:bg-white/12 transition duration-200 ml-2">
                  <Menu size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Portal dropdown: preserves original dropdown styles but renders outside navbar to allow correct backdrop blur */}
      {open && coords
        ? createPortal(
            <div
              ref={dropdownRef}
              role="dialog"
              aria-modal="false"
              aria-label="User menu"
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: 256,
                zIndex: 9999,
                WebkitBackdropFilter: 'blur(8px)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="rounded-2xl bg-white/5 border border-white/15 text-white shadow-lg z-20 overflow-hidden"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                {userName && (
                  <div className="px-4 py-3 border-b border-white/12 bg-white/4 flex" style={{ backdropFilter: 'blur(8px)' }}>
                    <p className="text-xs text-white/60 mt-2">Logged in as</p>
                    <p className="text-lg font-bold text-white pl-28">{userName}</p>
                  </div>
                )}
                <div className=" bg-transparent">
                  {userName ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition duration-200 font-medium"
                        style={{ backdropFilter: 'blur(8px)' }}
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          document.cookie = 'jwt=; path=/; max-age=0';
                          localStorage.clear();
                          setUserName(null);
                          localShow('Logged out successfully', 'success');
                          navigate('/login');
                        }}
                        className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition duration-200 font-medium"
                        style={{ backdropFilter: 'blur(8px)' }}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate('/login');
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition duration-200 font-medium"
                      style={{ backdropFilter: 'blur(8px)' }}
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
