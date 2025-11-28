// Using JSX transform; no need to import React directly
import { Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import NavLogo from '../assets/NavLogo.svg';

export default function UserNavbar() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <header className="w-full bg-transparent px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-full border border-slate-800 px-6 py-3 flex items-center justify-between gap-4 bg-transparent bg-opacity-40 backdrop-blur-sm">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <img src={NavLogo} alt="BLACKTICKET" className="w-auto h-auto" />
        </div>

        {/* Center: Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white opacity-90">
          <a href="#" className="hover:underline">Home</a>
          <a href="#" className="hover:underline">Movies</a>
          <a href="#" className="hover:underline">About Us</a>
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          <button className="hidden md:inline-flex items-center gap-2 bg-white bg-opacity-10 text-white rounded-full px-3 py-1 hover:bg-opacity-20">
            <span className="text-sm">Guest</span>
          </button>

          <div className="relative" ref={toggleRef}>
            <button
              aria-haspopup="true"
              aria-expanded={open}
              onClick={() => setOpen((s) => !s)}
              className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white"
            >
              <span className="sr-only">Login</span>
              {/* simple avatar circle */}
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 20a8 8 0 0116 0" />
              </svg>
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-36 rounded-md bg-slate-900 text-white border border-slate-700 shadow-md z-20">
                <ul className="py-1 text-sm">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        // Navigate to /login (simple navigation since no router is installed)
                        window.location.pathname = '/auth';
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800"
                    >
                      Login
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <button className="md:hidden inline-flex items-center justify-center p-2 rounded-full bg-white bg-opacity-10 text-white">
            <Menu size={18} />
          </button>
        </div>
        </div>
      </div>
    </header>
  );
}
