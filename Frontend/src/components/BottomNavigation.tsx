// Using JSX transform; no need to import React directly
import { Home, Film, Info, User } from 'lucide-react';
import { useRef, useState } from 'react';

export default function BottomNavigation() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (e: React.MouseEvent) => {
    if (toggleRef.current && !toggleRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-slate-800 z-40">
        <div className="flex items-center justify-around px-4 py-3">
          {/* Home */}
          <a
            href="#"
            className="flex flex-col items-center gap-1 text-white hover:text-yellow-400 transition duration-200"
          >
            <Home size={24} className="text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Home</span>
          </a>

          {/* Movies */}
          <a
            href="#"
            className="flex flex-col items-center gap-1 text-white hover:text-yellow-400 transition duration-200"
          >
            <Film size={24} />
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
                className="absolute bottom-full right-0 mb-2 w-32 rounded-2xl bg-black border border-slate-700 shadow-lg z-50"
                onClick={handleClickOutside}
              >
                <ul className="py-2 text-xs">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        window.location.pathname = '/auth';
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-slate-800 transition duration-200 font-medium"
                    >
                      Login
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-full text-left px-4 py-2 text-white hover:bg-slate-800 transition duration-200 font-medium"
                    >
                      Logout
                    </button>
                  </li>
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
