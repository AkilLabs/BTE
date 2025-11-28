// Using JSX transform; no need to import React directly
import { Link } from 'react-router-dom';
import BTlogo from '../../assets/BTlogo.png';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Top: logo on mobile */}
          <div className="md:hidden flex items-center justify-center mb-6">
            <img src={BTlogo} alt="BlackTicket" className="w-40" />
          </div>

          {/* Left: form */}
          <div className="w-full text-left order-2 md:order-1">
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-3 leading-tight">Forgot Password?</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">Don't worry! It occurs. Please enter the email address linked with your account.</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  placeholder="harlee@gmail.com"
                  defaultValue=""
                  name="email"
                  type="email"
                  aria-label="email"
                />
              </div>

              <button className="w-full bg-[#FBBB00] text-black font-bold rounded-full px-6 py-2.5 shadow-md mt-4 text-sm md:text-base hover:bg-yellow-500 transition" type="button">
                Send Code
              </button>

              <p className="text-xs text-slate-500 mt-6 text-center md:text-left leading-relaxed">
                Remember Password?{' '}
                <Link
                  to="/login"
                  className="text-yellow-400 hover:underline font-semibold"
                >
                  Login
                </Link>
                !
              </p>
            </div>
          </div>

          {/* Right: big logo on desktop */}
          <div className="hidden md:flex items-center justify-center order-2">
            <img src={BTlogo} alt="BlackTicket" className="w-56 drop-shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
