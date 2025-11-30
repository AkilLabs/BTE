// Using JSX transform; no need to import React directly
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import BTlogo from '../../assets/BTlogo.png';
import { Loader } from 'lucide-react';
import { verifyOTP, requestPasswordReset } from '../../services/authService';

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [email, setEmail] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);

  useEffect(() => {
    // Get email from navigation state
    const state = location.state as { email?: string };
    if (state?.email) {
      setEmail(state.email);
    } else {
      // Redirect back to forgot password if no email
      showToast('Please enter your email first', 'error');
      navigate('/forgot-password');
    }
  }, [location, navigate, showToast]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);
    if (digits.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      showToast('Please enter the 6-digit OTP', 'error');
      setLoading(false);
      return;
    }

    try {
      const result = await verifyOTP(email, otpCode);

      if (result.success) {
        showToast('OTP verified successfully!', 'success');
        // Navigate to new password page with email
        setTimeout(() => {
          navigate('/new-password', { state: { email: result.email } });
        }, 500);
      } else {
        showToast(result.error || 'OTP verification failed', 'error');
        setOtp(['', '', '', '', '', '']); // Clear OTP
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      showToast('An unexpected error occurred. Please try again.', 'error');
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        showToast('New OTP sent to your email!', 'success');
        setResendTimer(60); // 60 seconds cooldown
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        showToast(result.error || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      showToast('An unexpected error occurred. Please try again.', 'error');
      console.error('Resend error:', error);
    } finally {
      setResendLoading(false);
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
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-3 leading-tight">OTP Verification</h3>
            <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8">Enter the verification code we just sent on your email address.</p>

            <form onSubmit={handleVerify} className="space-y-4">
              {/* OTP Input Boxes */}
              <div className="flex gap-2 md:gap-3 justify-center md:justify-start">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={otp[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-8 h-8 md:w-10 md:h-10 bg-transparent border-2 border-slate-700 rounded-lg text-white text-base md:text-lg font-bold text-center outline-none focus:border-yellow-400 transition disabled:opacity-50"
                    aria-label={`OTP digit ${index + 1}`}
                    disabled={loading}
                  />
                ))}
              </div>

              <button
                className="w-full bg-[#FBBB00] text-black font-bold rounded-full px-6 py-2.5 shadow-md mt-4 text-sm md:text-base hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="submit"
                disabled={loading}
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              <p className="text-xs text-slate-500 mt-6 text-center md:text-left leading-relaxed">
                Didn't receive code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || resendLoading}
                  className="text-yellow-400 hover:underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {resendLoading && <Loader className="w-3 h-3 animate-spin" />}
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                </button>
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
