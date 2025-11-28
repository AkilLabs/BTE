// Using JSX transform; no need to import React directly
import { useState } from 'react';
import BTlogo from '../../assets/BTlogo.png';
import { User, Mail, Eye, EyeOff, Lock } from 'lucide-react';

export default function Signup() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md text-center px-6">
        <img src={BTlogo} alt="BlackTicket" className="mx-auto w-48 mb-6" />

        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3 border-b border-slate-700 py-2">
            <User className="w-5 h-5 text-slate-300" />
            <input
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
              placeholder="Harlee"
              defaultValue=""
              name="name"
              aria-label="name"
            />
          </div>

          <div className="flex items-center gap-3 border-b border-slate-700 py-2">
            <Mail className="w-5 h-5 text-slate-300" />
            <input
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
              placeholder="harlee@gmail.com"
              defaultValue=""
              name="email"
              type="email"
              aria-label="email"
            />
          </div>

          <div className="flex items-center gap-3 border-b border-slate-700 py-2">
            <Lock className="w-5 h-5 text-slate-300" />
            <input
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
              placeholder="********"
              name="password"
              type={showPass ? 'text' : 'password'}
              aria-label="password"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="text-slate-300"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button className="w-full bg-[#FBBB00] text-black font-semibold rounded-full px-6 py-3 shadow-md mt-4" type="button">
            Continue
          </button>

          <div className="flex items-center gap-3 my-4 text-slate-400">
            <span className="flex-1 border-t border-slate-700" />
            <span className="text-sm">Or continue with</span>
            <span className="flex-1 border-t border-slate-700" />
          </div>

          <button className="w-full bg-slate-800 text-white font-medium rounded-full px-4 py-3 flex items-center justify-center gap-3">
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">G</div>
            <span>Google</span>
          </button>

          <p className="text-xs text-slate-400 mt-6 text-center">
            By sign in or sign up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
