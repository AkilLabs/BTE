// Using JSX transform; no need to import React directly
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import BTlogo from '../../assets/BTlogo.png';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/user_login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Login failed. Please try again.';
        showToast(errorMessage, 'error');
        return;
      }

      // Set JWT to cookie
      if (data.token) {
        document.cookie = `jwt=${data.token.jwt}; path=/; max-age=86400; SameSite=Lax`;
      }

      showToast('Login successful! Redirecting...', 'success');
      // Navigate to home on successful login
      setTimeout(() => navigate('/user-home'), 500);
    } catch (err) {
      showToast('An error occurred. Please try again later.', 'error');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-3 leading-tight">Welcome back! Glad to see you, Again!</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">Sign in to your account and continue booking your favorite movies.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  placeholder="harlee@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  name="email"
                  type="email"
                  aria-label="email"
                  required
                />
              </div>

              <div className="flex items-center gap-3 border-b border-slate-700 py-2">
                <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  aria-label="password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="text-slate-400 flex-shrink-0"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-yellow-400 hover:underline text-xs font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              <button 
                className="w-full bg-[#FBBB00] text-black font-bold rounded-full px-6 py-2.5 shadow-md mt-4 text-sm md:text-base hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Continue'}
              </button>

              <div className="flex items-center gap-4 my-4 text-slate-500">
                <span className="flex-1 border-t border-slate-700" />
                <span className="text-xs font-medium">Or Login with</span>
                <span className="flex-1 border-t border-slate-700" />
              </div>

              <button className="w-full bg-slate-800 text-white font-medium rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-slate-700 transition text-xs">
                <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">G</div>
                <span>Google</span>
              </button>

              <p className="text-xs text-slate-500 mt-6 text-center md:text-left leading-relaxed">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-yellow-400 hover:underline font-semibold"
                >
                  Register Now
                </Link>
                !
              </p>
            </form>
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
