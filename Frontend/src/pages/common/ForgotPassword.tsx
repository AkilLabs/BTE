// Using JSX transform; no need to import React directly
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import BTlogo from '../../assets/BTlogo.png';
import { Mail, Loader } from 'lucide-react';
import { requestPasswordReset } from '../../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate email
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address', 'error');
      setLoading(false);
      return;
    }

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        showToast('OTP sent successfully! Check your email.', 'success');
        // Navigate to OTP verification page and pass email
        setTimeout(() => {
          navigate('/otp-verification', { state: { email: result.email || email } });
        }, 500);
      } else {
        showToast(result.error || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred. Please try again.', 'error');
      console.error('Send code error:', error);
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
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-3 leading-tight">Forgot Password?</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">Don't worry! It occurs. Please enter the email address linked with your account.</p>

            <form onSubmit={handleSendCode} className="space-y-4">
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
                  disabled={loading}
                />
              </div>

              <button
                className="w-full bg-[#FBBB00] text-black font-bold rounded-full px-6 py-2.5 shadow-md mt-4 text-sm md:text-base hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="submit"
                disabled={loading}
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Sending...' : 'Send Code'}
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
