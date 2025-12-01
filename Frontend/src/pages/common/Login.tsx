// Using JSX transform; no need to import React directly
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import BTlogo from '../../assets/BTlogo.png';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleGoogleButtonClick = () => {
    // Find and click the hidden Google button
    const googleButton = googleButtonRef.current?.querySelector('[role="button"]') as HTMLElement;
    if (googleButton) {
      console.log('Clicking Google button');
      googleButton.click();
    } else {
      console.error('Google button not found');
      showToast('Google Sign-In not loaded. Please refresh the page.', 'error');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const token = credentialResponse.credential;
      const apiResponse = await fetch('http://68.183.80.191:8000/api/google-auth/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        const errorMessage = data.error || 'Google login failed. Please try again.';
        showToast(errorMessage, 'error');
        return;
      }

      // Account exists or auto-created
      const jwtToken = data.token.jwt;
      document.cookie = `jwt=${jwtToken}; path=/; max-age=86400; SameSite=Lax`;
      
      showToast(data.account_status === 'created' ? 'Account created! Welcome!' : 'Login successful! Redirecting...', 'success');
      
      // Decode JWT to get role
      const decodedToken = JSON.parse(atob(jwtToken.split('.')[1]));
      const role = decodedToken.role;
      
      // Navigate based on role
      const navigationPath = role === 'admin' ? '/admin-dashboard' : '/';
      setTimeout(() => navigate(navigationPath), 500);
    } catch (err) {
      showToast('An error occurred during Google login.', 'error');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://68.183.80.191:8000/api/user_login/', {
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

      // Set JWT to cookie and localStorage
      if (data.token) {
        const jwtToken = data.token.jwt;
        document.cookie = `jwt=${jwtToken}; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem('userEmail', email);
        
        showToast('Login successful! Redirecting...', 'success');
        
        // Decode JWT to get role
        const decodedToken = JSON.parse(atob(jwtToken.split('.')[1]));
        const role = decodedToken.role;
        
        // Navigate based on role
        const navigationPath = role === 'admin' ? '/admin-dashboard' : '/';
        setTimeout(() => navigate(navigationPath), 500);
      }
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
                <span className="text-xs font-medium">Or</span>
                <span className="flex-1 border-t border-slate-700" />
              </div>

              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <button 
                  type="button"
                  onClick={handleGoogleButtonClick}
                  className="w-full bg-black text-white font-bold rounded-full px-6 py-2.5 shadow-md mt-4 text-sm md:text-base border border-slate-600 hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3" 
                  disabled={loading}
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/24px-Google_%22G%22_logo.svg.png?20230822192911" 
                    alt="Google" 
                    className="w-5 h-5"
                  />
                  <span>{loading ? 'Logging in...' : 'Continue with Google'}</span>
                </button>
                <div className="hidden" ref={googleButtonRef}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => showToast('Google login failed', 'error')}
                    theme="filled_black"
                    size="large"
                    text="continue_with"
                  />
                </div>
              </GoogleOAuthProvider>

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
