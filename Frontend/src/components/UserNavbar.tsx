// Using JSX transform; no need to import React directly
import { Menu, Home, Film, Info, User } from 'lucide-react';
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
    <header className="hidden md:block fixed top-0 left-0 right-0 w-full z-40 px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Glassmorphism navbar */}
        <div className="rounded-full border border-white/15 px-8 py-5 flex items-center justify-center gap-16 bg-white/8 backdrop-blur-sm shadow-lg">
          {/* Left: Logo */}
          <div className="absolute left-8 flex items-center gap-3">
            <img src={NavLogo} alt="BLACKTICKET" className="h-12 w-auto" />
          </div>

          {/* Center: Nav links */}
          <nav className="flex items-center gap-10 text-sm md:text-base text-white/80">
            <a href="#" className="hover:text-white transition duration-200 font-medium">Home</a>
            <a href="#" className="hover:text-white transition duration-200 font-medium">Movies</a>
            <a href="#" className="hover:text-white transition duration-200 font-medium">About Us</a>
          </nav>

          {/* Right: User profile dropdown */}
          <div className="absolute right-8 flex items-center gap-2 md:gap-3">
            {/* Dropdown Menu */}
            <div className="relative" ref={toggleRef}>
              <button
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="w-10 h-10 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-white hover:bg-white/12 transition duration-200"
              >
                <span className="sr-only">User menu</span>
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20a8 8 0 0116 0" />
                </svg>
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-3 w-40 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-white shadow-lg z-20">
                  <ul className="py-2 text-sm">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          window.location.pathname = '/auth';
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition duration-200 font-medium rounded-lg mx-2 my-1"
                      >
                        Login
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition duration-200 font-medium rounded-lg mx-2 my-1"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
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
